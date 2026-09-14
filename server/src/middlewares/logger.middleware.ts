import type { Request, Response, NextFunction } from "express";
import logger from "../utils/logger.js";

const loggerMiddleware = (
    req: Request,
    res: Response,
    next: NextFunction
): void => {
    const start = Date.now();

    res.on("finish", () => {
        const duration = Date.now() - start;

        const method = req.method.padEnd(6);
        const status = res.statusCode;
        const url = req.originalUrl;
        const ip = req.ip || "unknown";

        logger.http(
            `${method} ${url} ${status} ${duration}ms ${ip}`
        );
    });

    next();
};

export default loggerMiddleware;