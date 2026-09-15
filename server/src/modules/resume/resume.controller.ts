import type { Request, Response } from "express";
import { ApiError } from "../../utils/ApiError.js";
import sendResponse from "../../utils/sendResponse.js";
import { resumeService } from "./resume.service.js";

const getAuthenticatedUserId = (req: Request): string => {
    if (!req.user) {
        throw new ApiError(401, "Authentication required.");
    }

    return req.user.userId;
};

export const uploadResume = async (
    req: Request,
    res: Response
): Promise<void> => {
    const file = req.file;

    if (!file) {
        throw new ApiError(400, "Resume file is required.");
    }

    const resume = await resumeService.uploadResume(
        getAuthenticatedUserId(req),
        file
    );

    sendResponse(res, 201, "Resume uploaded successfully.", resume);
};

export const getMyResumes = async (
    req: Request,
    res: Response
): Promise<void> => {
    const resumes = await resumeService.getMyResumes(
        getAuthenticatedUserId(req)
    );

    sendResponse(res, 200, "Resumes retrieved successfully.", resumes);
};

export const getMyResumeById = async (
    req: Request,
    res: Response
): Promise<void> => {
    const resume = await resumeService.getMyResumeById(
        getAuthenticatedUserId(req),
        req.params.id as string
    );

    sendResponse(res, 200, "Resume retrieved successfully.", resume);
};

export const deleteResume = async (
    req: Request,
    res: Response
): Promise<void> => {
    await resumeService.deleteResume(
        getAuthenticatedUserId(req),
        req.params.id as string
    );

    sendResponse(res, 200, "Resume deleted successfully.");
};
