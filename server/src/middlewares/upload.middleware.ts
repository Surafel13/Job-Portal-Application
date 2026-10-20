import { extname } from "node:path";
import multer from "multer";
import { ApiError } from "../utils/ApiError.js";
import {
    ALLOWED_RESUME_EXTENSIONS,
    ALLOWED_RESUME_MIME_TYPES,
    MAX_RESUME_SIZE_BYTES,
} from "../modules/resume/resume.constants.js";

const resumeUpload = multer({
    storage: multer.memoryStorage(),
    fileFilter: (_req, file, callback) => {
        const extension = extname(file.originalname).toLowerCase();

        if (
            !ALLOWED_RESUME_MIME_TYPES.includes(
                file.mimetype as (typeof ALLOWED_RESUME_MIME_TYPES)[number]
            ) ||
            !ALLOWED_RESUME_EXTENSIONS.includes(
                extension as (typeof ALLOWED_RESUME_EXTENSIONS)[number]
            )
        ) {
            callback(
                new ApiError(400, "Only PDF and DOCX resume files are allowed.")
            );
            return;
        }

        callback(null, true);
    },
    limits: {
        fileSize: MAX_RESUME_SIZE_BYTES,
        files: 1,
    },
});

export default resumeUpload;
