import test from "node:test";
import assert from "node:assert/strict";
import { Types } from "mongoose";
import { ApiError } from "../../../utils/ApiError.js";
import { generateJobDescriptionSchema } from "./jobDescription.validation.js";
import { parseGeneratedJobDescription } from "./jobDescription.parser.js";
import { JobDescriptionService } from "./jobDescription.service.js";

const validInput = {
  title: "Backend Engineer",
  skills: ["Node.js", "MongoDB"],
  experienceLevel: "mid" as const,
  employmentType: "full-time" as const,
};

const validOutput = JSON.stringify({
  description: "We are looking for a backend engineer to build APIs.",
  responsibilities: ["Build APIs.", "Review code.", "Improve performance."],
  requirements: [
    "3+ years Node.js.",
    "MongoDB experience.",
    "Good communication.",
  ],
});

test("generateJobDescriptionSchema rejects empty skills and unknown keys", () => {
  assert.equal(
    generateJobDescriptionSchema.safeParse({ ...validInput, skills: [] })
      .success,
    false,
  );
  assert.equal(
    generateJobDescriptionSchema.safeParse({ ...validInput, extra: 1 }).success,
    false,
  );
  assert.equal(
    generateJobDescriptionSchema.safeParse(validInput).success,
    true,
  );
});

test("parseGeneratedJobDescription strips code fences and validates shape", () => {
  const parsed = parseGeneratedJobDescription(
    "```json\n" + validOutput + "\n```",
  );
  assert.equal(parsed.responsibilities.length, 3);

  assert.throws(
    () => parseGeneratedJobDescription("not json"),
    (e: unknown) => e instanceof ApiError && e.statusCode === 502,
  );
  assert.throws(
    () =>
      parseGeneratedJobDescription(JSON.stringify({ description: "short" })),
    (e: unknown) => e instanceof ApiError && e.statusCode === 502,
  );
});

const makeService = (
  status: string | null,
  generate = async () => validOutput,
) =>
  new JobDescriptionService(
    {
      findByRecruiterId: async () =>
        status
          ? { _id: new Types.ObjectId(), verificationStatus: status }
          : null,
    } as never,
    generate,
  );

test("JobDescriptionService blocks unverified employers", async () => {
  await assert.rejects(
    () => makeService("pending").generate("u1", validInput),
    (e: unknown) => e instanceof ApiError && e.statusCode === 403,
  );
  await assert.rejects(
    () => makeService(null).generate("u1", validInput),
    (e: unknown) => e instanceof ApiError && e.statusCode === 404,
  );
});

test("JobDescriptionService returns parsed content and maps AI failures to 502", async () => {
  const result = await makeService("verified").generate("u1", validInput);
  assert.equal(result.requirements.length, 3);

  await assert.rejects(
    () =>
      makeService("verified", async () => {
        throw new Error("boom");
      }).generate("u1", validInput),
    (e: unknown) => e instanceof ApiError && e.statusCode === 502,
  );
});
