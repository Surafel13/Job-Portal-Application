import rateLimit from "express-rate-limit";
import type { RequestHandler } from "express";

const rateLimitMiddleware: RequestHandler = rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 100,
    standardHeaders: "draft-7",
    legacyHeaders: false,
    message: {
        success: false,
        statusCode: 429,
        message: "Too many requests. Please try again later.",
    },
});

export default rateLimitMiddleware;
