import { basename, extname } from "node:path";
import { ApiError } from "../../utils/ApiError.js";
import {
    ALLOWED_RESUME_EXTENSIONS,
    ALLOWED_RESUME_MIME_TYPES,
    MAX_RESUME_SIZE_BYTES,
    type ResumeMimeType,
} from "./resume.constants.js";

const PDF_MAGIC = Buffer.from("%PDF");
const ZIP_MAGIC = Buffer.from([0x50, 0x4b, 0x03, 0x04]);

const isPdfBuffer = (buffer: Buffer): boolean =>
    buffer.length >= PDF_MAGIC.length &&
    buffer.subarray(0, PDF_MAGIC.length).equals(PDF_MAGIC);

const isZipBuffer = (buffer: Buffer): boolean =>
    buffer.length >= ZIP_MAGIC.length &&
    buffer.subarray(0, ZIP_MAGIC.length).equals(ZIP_MAGIC);

export const sanitizeOriginalName = (originalName: string): string => {
    const safeName = basename(originalName).replace(/[^\w.\-() ]+/g, "_");
    const trimmed = safeName.trim();

    if (!trimmed) {
        throw new ApiError(400, "Resume file name is invalid.");
    }

    return trimmed.slice(0, 255);
};

export const validateResumeFile = (
    file: Pick<Express.Multer.File, "originalname" | "mimetype" | "size" | "buffer">
): { originalName: string; mimeType: ResumeMimeType } => {
    if (!file?.buffer?.length) {
        throw new ApiError(400, "Resume file is required.");
    }

    if (file.size <= 0 || file.buffer.length <= 0) {
        throw new ApiError(400, "Resume file cannot be empty.");
    }

    if (file.size > MAX_RESUME_SIZE_BYTES || file.buffer.length > MAX_RESUME_SIZE_BYTES) {
        throw new ApiError(400, "Resume file must be 5MB or smaller.");
    }

    const originalName = sanitizeOriginalName(file.originalname);
    const extension = extname(originalName).toLowerCase();

    if (
        !ALLOWED_RESUME_MIME_TYPES.includes(file.mimetype as ResumeMimeType) ||
        !ALLOWED_RESUME_EXTENSIONS.includes(
            extension as (typeof ALLOWED_RESUME_EXTENSIONS)[number]
        )
    ) {
        throw new ApiError(400, "Only PDF and DOCX resume files are allowed.");
    }

    if (extension === ".pdf" || file.mimetype === "application/pdf") {
        if (extension !== ".pdf" || file.mimetype !== "application/pdf" || !isPdfBuffer(file.buffer)) {
            throw new ApiError(
                400,
                "Resume file content does not match a valid PDF."
            );
        }

        return { originalName, mimeType: "application/pdf" };
    }

    if (
        extension !== ".docx" ||
        file.mimetype !==
            "application/vnd.openxmlformats-officedocument.wordprocessingml.document" ||
        !isZipBuffer(file.buffer)
    ) {
        throw new ApiError(
            400,
            "Resume file content does not match a valid DOCX document."
        );
    }

    return {
        originalName,
        mimeType:
            "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    };
};
