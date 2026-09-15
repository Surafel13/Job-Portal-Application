import type { Request, Response } from "express";
import { ApiError } from "../../utils/ApiError.js";
import sendResponse from "../../utils/sendResponse.js";
import { workerService } from "./worker.service.js";
import type {
    CreateWorkerInput,
    UpdateWorkerInput,
} from "./worker.validation.js";

const getAuthenticatedUserId = (req: Request): string => {
    if (!req.user) {
        throw new ApiError(401, "Authentication required.");
    }

    return req.user.userId;
};

export const createWorker = async (
    req: Request,
    res: Response
): Promise<void> => {
    const worker = await workerService.createWorker(
        getAuthenticatedUserId(req),
        req.body as CreateWorkerInput
    );

    sendResponse(res, 201, "Worker profile created successfully.", worker);
};

export const getMyWorkerProfile = async (
    req: Request,
    res: Response
): Promise<void> => {
    const worker = await workerService.getWorkerByUserId(
        getAuthenticatedUserId(req)
    );

    sendResponse(res, 200, "Worker profile retrieved successfully.", worker);
};

export const getWorkerByUserId = async (
    req: Request,
    res: Response
): Promise<void> => {
    const worker = await workerService.getWorkerByUserId(
        req.params.userId as string
    );

    sendResponse(res, 200, "Worker profile retrieved successfully.", worker);
};

export const updateWorker = async (
    req: Request,
    res: Response
): Promise<void> => {
    const worker = await workerService.updateWorker(
        getAuthenticatedUserId(req),
        req.body as UpdateWorkerInput
    );

    sendResponse(res, 200, "Worker profile updated successfully.", worker);
};

export const deleteWorker = async (
    req: Request,
    res: Response
): Promise<void> => {
    await workerService.deleteWorker(getAuthenticatedUserId(req));

    sendResponse(res, 200, "Worker profile deleted successfully.");
};
