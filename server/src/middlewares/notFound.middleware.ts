import type { Request, Response, NextFunction } from "express";
import { ApiError } from "../utils/ApiError.js";

const notFoundMiddleware = (
    req: Request,
    _res: Response,
    next: NextFunction
): void => {
    next(new ApiError(404, `Route not found: ${req.method} ${req.originalUrl}`));
};

export default notFoundMiddleware;
