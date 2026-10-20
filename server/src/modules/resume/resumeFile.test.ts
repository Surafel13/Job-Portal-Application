import test from "node:test";
import assert from "node:assert/strict";
import { ApiError } from "../../utils/ApiError.js";
import { sanitizeOriginalName, validateResumeFile } from "./resumeFile.js";
import { MAX_RESUME_SIZE_BYTES } from "./resume.constants.js";

const pdfBuffer = Buffer.from("%PDF-1.4\n% test pdf");
const docxBuffer = Buffer.from([0x50, 0x4b, 0x03, 0x04, 0x14, 0x00, 0x06, 0x00]);
const fakePdf = {
    originalname: "cv.pdf",
    mimetype: "application/pdf" as const,
    size: pdfBuffer.length,
    buffer: pdfBuffer,
};

test("sanitizeOriginalName strips path segments and unsafe characters", () => {
    assert.equal(sanitizeOriginalName("../../evil.pdf"), "evil.pdf");
    assert.equal(sanitizeOriginalName("My Resume (final).pdf"), "My Resume (final).pdf");
});

test("validateResumeFile accepts a real PDF signature", () => {
    const result = validateResumeFile(fakePdf);
    assert.equal(result.mimeType, "application/pdf");
    assert.equal(result.originalName, "cv.pdf");
});

test("validateResumeFile accepts a DOCX zip signature", () => {
    const result = validateResumeFile({
        originalname: "resume.docx",
        mimetype:
            "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        size: docxBuffer.length,
        buffer: docxBuffer,
    });
    assert.equal(
        result.mimeType,
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
    );
});

test("validateResumeFile rejects spoofed PDF content", () => {
    assert.throws(
        () =>
            validateResumeFile({
                ...fakePdf,
                buffer: Buffer.from("not a pdf"),
                size: 9,
            }),
        (error: unknown) =>
            error instanceof ApiError &&
            error.statusCode === 400 &&
            error.message.includes("PDF")
    );
});

test("validateResumeFile rejects mime and extension mismatch", () => {
    assert.throws(
        () =>
            validateResumeFile({
                ...fakePdf,
                originalname: "cv.docx",
            }),
        (error: unknown) => error instanceof ApiError && error.statusCode === 400
    );
});

test("validateResumeFile rejects oversized files", () => {
    assert.throws(
        () =>
            validateResumeFile({
                ...fakePdf,
                size: MAX_RESUME_SIZE_BYTES + 1,
            }),
        (error: unknown) =>
            error instanceof ApiError &&
            error.message.includes("5MB")
    );
});

test("validateResumeFile rejects empty files", () => {
    assert.throws(
        () =>
            validateResumeFile({
                originalname: "empty.pdf",
                mimetype: "application/pdf",
                size: 0,
                buffer: Buffer.alloc(0),
            }),
        (error: unknown) => error instanceof ApiError && error.statusCode === 400
    );
});
