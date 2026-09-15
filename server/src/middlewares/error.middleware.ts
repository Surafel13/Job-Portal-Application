import type { ErrorRequestHandler } from "express";
import mongoose from "mongoose";
import multer from "multer";
import { ZodError } from "zod";
import logger from "../utils/logger.js";
import { ApiError } from "../utils/ApiError.js";

const errorMiddleware: ErrorRequestHandler = (
    error,
    req,
    res,
    _next
): void => {
    logger.error(error, {
        method: req.method,
        url: req.originalUrl,
    });

    if (error instanceof ApiError) {
        res.status(error.statusCode).json({
            success: false,
            message: error.message,
            errors: error.errors,
        });
        return;
    }

    if (error instanceof ZodError) {
        res.status(400).json({
            success: false,
            message: "Validation failed",
            errors: error.issues.map((issue) => ({
                field: issue.path.join("."),
                message: issue.message,
            })),
        });
        return;
    }

    if (error instanceof mongoose.Error.ValidationError) {
        res.status(400).json({
            success: false,
            message: "Database validation failed",
            errors: Object.values(error.errors).map((item) => ({
                field: item.path,
                message: item.message,
            })),
        });
        return;
    }

    if (error instanceof mongoose.Error.CastError) {
        res.status(400).json({
            success: false,
            message: `Invalid value for ${error.path}`,
            errors: [],
        });
        return;
    }

    if (error instanceof multer.MulterError) {
        res.status(400).json({
            success: false,
            message: error.message,
            errors: [],
        });
        return;
    }

    res.status(500).json({
        success: false,
        message: "Internal server error",
        errors: [],
    });
};

export default errorMiddleware;
