import test from "node:test";
import assert from "node:assert/strict";
import http from "node:http";
import type { AddressInfo } from "node:net";
import express from "express";
import { Types } from "mongoose";
import { ApiError } from "../../../utils/ApiError.js";
import errorMiddleware from "../../../middlewares/error.middleware.js";
import { formatSseEvent } from "../../../utils/sse.js";
import { JobDescriptionController } from "./jobDescription.controller.js";
import {
  JobDescriptionService,
  type TextStreamer,
} from "./jobDescription.service.js";
import type { JobDescriptionStreamEvent } from "./jobDescription.interface.js";

const validInput = {
  title: "Backend Engineer",
  skills: ["Node.js", "node.js", "MongoDB"],
  experienceLevel: "mid" as const,
  employmentType: "full-time" as const,
};

const output = {
  description: "We are looking for a backend engineer to build APIs.",
  responsibilities: ["Build APIs.", "Review code.", "Improve performance."],
  requirements: ["3+ years Node.js.", "MongoDB experience.", "Communication."],
};
const validOutput = JSON.stringify(output);

const slices = (text: string, count: number): string[] => {
  const size = Math.ceil(text.length / count);
  return Array.from({ length: count }, (_, i) =>
    text.slice(i * size, (i + 1) * size),
  );
};

const makeService = (status: string | null, streamText: TextStreamer) =>
  new JobDescriptionService(
    {
      findByRecruiterId: async () =>
        status
          ? { _id: new Types.ObjectId(), verificationStatus: status }
          : null,
    } as never,
    undefined,
    streamText,
  );

const collect = async (
  gen: AsyncGenerator<JobDescriptionStreamEvent, void, undefined>,
) => {
  const events: JobDescriptionStreamEvent[] = [];
  for await (const event of gen) events.push(event);
  return events;
};

test("formatSseEvent emits a single-line JSON data frame", () => {
  assert.equal(
    formatSseEvent("chunk", { text: "a\nb" }),
    'event: chunk\ndata: {"text":"a\\nb"}\n\n',
  );
});

test("service streams chunks then a validated done event", async () => {
  let receivedSkills: string[] = [];
  const service = makeService("verified", async function* (input) {
    receivedSkills = input.skills;
    for (const piece of slices(validOutput, 4)) yield piece;
  });

  const events = await collect(await service.openStream("u1", validInput));
  const chunks = events.filter((e) => e.type === "chunk");

  assert.equal(chunks.length, 4);
  assert.deepEqual(receivedSkills, ["Node.js", "MongoDB"]);
  const last = events.at(-1);
  assert.equal(last?.type, "done");
  assert.deepEqual(last?.type === "done" ? last.result : null, output);
});

test("service rejects unverified employers before streaming", async () => {
  let called = false;
  const service = makeService("pending", async function* () {
    called = true;
    yield "x";
  });

  await assert.rejects(
    () => service.openStream("u1", validInput),
    (e: unknown) => e instanceof ApiError && e.statusCode === 403,
  );
  assert.equal(called, false);
});

test("service maps upstream failures to 502 after partial output", async () => {
  const service = makeService("verified", async function* () {
    yield '{"description":';
    throw new Error("boom");
  });
  const gen = await service.openStream("u1", validInput);

  assert.equal((await gen.next()).value?.type, "chunk");
  await assert.rejects(
    () => gen.next(),
    (e: unknown) => e instanceof ApiError && e.statusCode === 502,
  );
});

test("service rejects empty and invalid final output", async () => {
  const empty = makeService("verified", async function* () {});
  await assert.rejects(
    async () => collect(await empty.openStream("u1", validInput)),
    (e: unknown) => e instanceof ApiError && e.statusCode === 502,
  );

  const invalid = makeService("verified", async function* () {
    yield "not json";
  });
  await assert.rejects(
    async () => collect(await invalid.openStream("u1", validInput)),
    (e: unknown) => e instanceof ApiError && e.statusCode === 502,
  );
});

test("service stops without a done event once aborted", async () => {
  const controller = new AbortController();
  const service = makeService("verified", async function* () {
    yield "a";
    yield "b";
  });
  const gen = await service.openStream("u1", validInput, controller.signal);

  assert.equal((await gen.next()).value?.type, "chunk");
  controller.abort();
  assert.equal((await gen.next()).done, true);
});

/* ------------------------- HTTP / SSE integration ------------------------- */

const startApp = async (service: JobDescriptionService) => {
  const app = express();
  app.use(express.json());
  app.use((req, _res, next) => {
    req.user = { userId: "u1", role: "employer" };
    next();
  });
  const controller = new JobDescriptionController(service);
  app.post("/stream", controller.stream);
  app.use(errorMiddleware);

  const server = http.createServer(app);
  await new Promise<void>((resolve) => server.listen(0, resolve));
  const { port } = server.address() as AddressInfo;

  return {
    url: `http://127.0.0.1:${port}/stream`,
    close: () =>
      new Promise<void>((resolve) => {
        server.closeAllConnections();
        server.close(() => resolve());
      }),
  };
};

const post = (url: string, signal?: AbortSignal) =>
  fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(validInput),
    ...(signal ? { signal } : {}),
  });

async function* sseEvents(res: Response) {
  const reader = res.body!.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    let index: number;
    while ((index = buffer.indexOf("\n\n")) !== -1) {
      const frame = buffer.slice(0, index);
      buffer = buffer.slice(index + 2);
      const event = /^event: (.*)$/m.exec(frame)?.[1];
      const data = /^data: (.*)$/m.exec(frame)?.[1];
      if (event && data) yield { event, data: JSON.parse(data) as unknown };
    }
  }
}

test(
  "SSE delivers the first chunk before generation finishes",
  { timeout: 10_000 },
  async () => {
    let release!: () => void;
    const gate = new Promise<void>((resolve) => (release = resolve));
    const [first, second] = [validOutput.slice(0, 20), validOutput.slice(20)];

    const app = await startApp(
      makeService("verified", async function* () {
        yield first;
        await gate;
        yield second;
      }),
    );

    try {
      const res = await post(app.url);
      assert.equal(res.status, 200);
      assert.match(
        res.headers.get("content-type") ?? "",
        /^text\/event-stream/,
      );
      assert.match(res.headers.get("cache-control") ?? "", /no-cache/);
      assert.equal(res.headers.get("x-accel-buffering"), "no");

      const iterator = sseEvents(res)[Symbol.asyncIterator]();
      const firstEvent = await iterator.next(); // arrives while the model is "still generating"
      assert.deepEqual(firstEvent.value, {
        event: "chunk",
        data: { text: first },
      });

      release();
      const rest: Array<{ event: string; data: unknown }> = [];
      for (let r = await iterator.next(); !r.done; r = await iterator.next()) {
        rest.push(r.value);
      }
      assert.deepEqual(
        rest.map((e) => e.event),
        ["chunk", "done"],
      );
      assert.deepEqual(rest[1].data, output);
    } finally {
      release();
      await app.close();
    }
  },
);

test(
  "SSE reports mid-stream failures as an error event",
  { timeout: 10_000 },
  async () => {
    const app = await startApp(
      makeService("verified", async function* () {
        yield '{"description":';
        throw new Error("boom");
      }),
    );

    try {
      const events: Array<{ event: string; data: unknown }> = [];
      for await (const e of sseEvents(await post(app.url))) events.push(e);

      assert.deepEqual(
        events.map((e) => e.event),
        ["chunk", "error"],
      );
      assert.equal((events[1].data as { statusCode: number }).statusCode, 502);
    } finally {
      await app.close();
    }
  },
);

test(
  "pre-stream failures stay regular JSON responses",
  { timeout: 10_000 },
  async () => {
    const app = await startApp(makeService("pending", async function* () {}));

    try {
      const res = await post(app.url);
      assert.equal(res.status, 403);
      assert.match(res.headers.get("content-type") ?? "", /application\/json/);
    } finally {
      await app.close();
    }
  },
);

test(
  "client disconnect aborts the upstream generation",
  { timeout: 10_000 },
  async () => {
    let markAborted!: () => void;
    const aborted = new Promise<void>((resolve) => (markAborted = resolve));

    const app = await startApp(
      makeService("verified", async function* (_input, signal) {
        yield "{";
        await new Promise<void>((resolve) => {
          if (signal?.aborted) return resolve();
          signal?.addEventListener("abort", () => resolve(), { once: true });
        });
        markAborted();
      }),
    );

    try {
      const client = new AbortController();
      const res = await post(app.url, client.signal);
      const iterator = sseEvents(res)[Symbol.asyncIterator]();
      assert.equal((await iterator.next()).value?.event, "chunk");

      client.abort();

      await Promise.race([
        aborted,
        new Promise((_, reject) =>
          setTimeout(
            () => reject(new Error("server never saw the disconnect")),
            3000,
          ).unref(),
        ),
      ]);
    } finally {
      await app.close();
    }
  },
);
