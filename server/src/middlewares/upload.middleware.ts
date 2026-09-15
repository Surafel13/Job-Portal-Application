import { extname } from "node:path";
import multer from "multer";
import { ApiError } from "../utils/ApiError.js";

const allowedMimeTypes = [
    "application/pdf",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
];

const allowedExtensions = [".pdf", ".docx"];

const resumeUpload = multer({
    storage: multer.memoryStorage(),
    fileFilter: (_req, file, callback) => {
        const extension = extname(file.originalname).toLowerCase();

        if (
            !allowedMimeTypes.includes(file.mimetype) ||
            !allowedExtensions.includes(extension)
        ) {
            callback(
                new ApiError(400, "Only PDF and DOCX resume files are allowed.")
            );
            return;
        }

        callback(null, true);
    },
    limits: {
        fileSize: 5 * 1024 * 1024,
        files: 1,
    },
});

export default resumeUpload;
