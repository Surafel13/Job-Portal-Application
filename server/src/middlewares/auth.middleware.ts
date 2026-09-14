import type { Request, Response, NextFunction } from "express";
import { verifyAccessToken } from "../utils/token.js";
import { ApiError } from "../utils/ApiError.js";

const authMiddleware = (
    req: Request,
    _res: Response,
    next: NextFunction
): void => {
    const authorization = req.headers.authorization;

    if (!authorization?.startsWith("Bearer ")) {
        next(new ApiError(401, "Authentication required."));
        return;
    }

    const token = authorization.split(" ")[1];

    if (!token) {
        next(new ApiError(401, "Authentication required."));
        return;
    }

    try {
        const payload = verifyAccessToken(token);

        req.user = {
            userId: payload.userId,
            role: payload.role,
        };

        next();
    } catch {
        next(new ApiError(401, "Invalid or expired access token."));
    }
};

export default authMiddleware;