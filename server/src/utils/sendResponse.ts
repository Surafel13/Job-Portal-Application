import type { Response } from "express";

interface ApiResponse<T> {
    success: boolean;
    statusCode: number;
    message: string;
    data?: T;
    meta?: Record<string, unknown>;
}

const sendResponse = <T>(
    res: Response,
    statusCode: number,
    message: string,
    data?: T,
    meta?: Record<string, unknown>
): Response => {
    const response: ApiResponse<T> = {
        success: statusCode < 400,
        statusCode,
        message,
        ...(data !== undefined && { data }),
        ...(meta !== undefined && { meta }),
    };


    return res.status(statusCode).json(response)

};

export default sendResponse;
