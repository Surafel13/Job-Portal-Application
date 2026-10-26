import rateLimit, { ipKeyGenerator } from "express-rate-limit";

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

export const messageRateLimitMiddleware: RequestHandler = rateLimit({
  windowMs: 1 * 60 * 1000,
  limit: 60,
  standardHeaders: "draft-7",
  legacyHeaders: false,
  message: {
    success: false,
    statusCode: 429,
    message: "You are sending messages too quickly. Please wait a moment.",
  },
});

export const aiGenerationRateLimitMiddleware: RequestHandler = rateLimit({
  windowMs: 60 * 1000,
  limit: 5,
  standardHeaders: "draft-7",
  legacyHeaders: false,
  keyGenerator: (req) => req.user?.userId ?? ipKeyGenerator(req.ip ?? ""),
  message: {
    success: false,
    statusCode: 429,
    message:
      "You are generating descriptions too quickly. Please wait a moment.",
  },
});

export default rateLimitMiddleware;
