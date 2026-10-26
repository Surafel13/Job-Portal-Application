import test from "node:test";
import assert from "node:assert/strict";
import { createSseParser } from "./sseParser.ts";

test("parses events split across arbitrary chunk boundaries", () => {
  const parser = createSseParser();
  const out = [
    ...parser.push("event: chu"),
    ...parser.push('nk\ndata: {"a":1}\n'),
    ...parser.push("\nevent: done\ndata: {}\n\n"),
  ];
  assert.deepEqual(out, [
    { event: "chunk", data: '{"a":1}' },
    { event: "done", data: "{}" },
  ]);
});

test("ignores comments, joins multi-line data, defaults event name", () => {
  const parser = createSseParser();
  assert.deepEqual(parser.push(": ping\n\ndata: a\ndata: b\n\n"), [
    { event: "message", data: "a\nb" },
  ]);
});

test("handles CRLF, including a CR/LF pair split across chunks", () => {
  const parser = createSseParser();
  const out = [
    ...parser.push("event: x\r\ndata: 1\r"),
    ...parser.push("\n\r\n"),
  ];
  assert.deepEqual(out, [{ event: "x", data: "1" }]);
});

test("does not emit an incomplete trailing frame", () => {
  const parser = createSseParser();
  assert.deepEqual(parser.push("event: chunk\ndata: {"), []);
});
