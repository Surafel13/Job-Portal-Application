export const MAX_RESUME_SIZE_BYTES = 5 * 1024 * 1024;

export const ALLOWED_RESUME_MIME_TYPES = [
    "application/pdf",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
] as const;

export const ALLOWED_RESUME_EXTENSIONS = [".pdf", ".docx"] as const;

export type ResumeMimeType = (typeof ALLOWED_RESUME_MIME_TYPES)[number];
