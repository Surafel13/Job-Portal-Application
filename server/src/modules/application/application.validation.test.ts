import test from "node:test";
import assert from "node:assert/strict";
import { Types } from "mongoose";
import {
    createApplicationSchema,
    updateApplicationStatusSchema,
    applicationIdSchema,
    jobIdSchema,
} from "./application.validation.js";

test("createApplicationSchema requires a valid resumeId and trims cover letters", () => {
    const resumeId = new Types.ObjectId().toString();
    const parsed = createApplicationSchema.parse({
        resumeId,
        coverLetter: "  Hello  ",
    });

    assert.equal(parsed.resumeId, resumeId);
    assert.equal(parsed.coverLetter, "Hello");
});

test("createApplicationSchema treats an empty cover letter as undefined", () => {
    const parsed = createApplicationSchema.parse({
        resumeId: new Types.ObjectId().toString(),
        coverLetter: "   ",
    });

    assert.equal(parsed.coverLetter, undefined);
});

test("createApplicationSchema rejects invalid resume IDs", () => {
    const result = createApplicationSchema.safeParse({
        resumeId: "not-an-id",
    });
    assert.equal(result.success, false);
});

test("updateApplicationStatusSchema rejects withdrawn", () => {
    const result = updateApplicationStatusSchema.safeParse({
        status: "withdrawn",
    });
    assert.equal(result.success, false);
});

test("application and job param schemas require ObjectIds", () => {
    const id = new Types.ObjectId().toString();
    assert.equal(applicationIdSchema.safeParse({ id }).success, true);
    assert.equal(jobIdSchema.safeParse({ jobId: id }).success, true);
    assert.equal(applicationIdSchema.safeParse({ id: "x" }).success, false);
});
