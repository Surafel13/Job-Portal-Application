import type { Request, Response, NextFunction, RequestHandler } from "express";

type AsyncHandler = (
    req: Request,
    res: Response,
    next: NextFunction
) => Promise<void>;

const asyncHandler = (handler: AsyncHandler): RequestHandler => {
    return (req, res, next): void => {
        Promise.resolve(handler(req, res, next)).catch(next);
    };
};

export default asyncHandler;
