import type { Request, Response } from "express";
import { ApiError } from "../../utils/ApiError.js";
import sendResponse from "../../utils/sendResponse.js";
import savedJobService from "./savedJob.service.js";

class SavedJobController {
    async saveJob(req: Request, res: Response) {
        if (!req.user) {
            throw new ApiError(401, "Authentication required.");
        }

        const savedJob = await savedJobService.saveJob(
            req.user.userId,
            req.params.jobId as string
        );

        sendResponse(
            res,
            201,
            "Job saved successfully.",
            savedJob
        );
    }

    async getMySavedJobs(req: Request, res: Response) {
        if (!req.user) {
            throw new ApiError(401, "Authentication required.");
        }

        const savedJobs = await savedJobService.getSavedJobsByUser(
            req.user.userId
        );

        sendResponse(
            res,
            200,
            "Saved jobs retrieved successfully.",
            savedJobs
        );
    }

    async getSavedJobById(req: Request, res: Response) {
        const savedJob = await savedJobService.getSavedJobById(
            req.params.id as string
        );

        sendResponse(
            res,
            200,
            "Saved job retrieved successfully.",
            savedJob
        );
    }

    async removeSavedJob(req: Request, res: Response) {
        if (!req.user) {
            throw new ApiError(401, "Authentication required.");
        }

        const savedJob = await savedJobService.removeSavedJob(
            req.user.userId,
            req.params.jobId as string
        );

        sendResponse(
            res,
            200,
            "Job removed from saved jobs successfully.",
            savedJob
        );
    }
}

export default new SavedJobController();