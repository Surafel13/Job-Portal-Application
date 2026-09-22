import type { Request, Response } from "express";
import { Types } from "mongoose";
import asyncHandler from "../../utils/asyncHandler.js";
import sendResponse from "../../utils/sendResponse.js";
import { ApplicantService } from "./applicant.service.js";

class ApplicantController {
    private applicantService = new ApplicantService();

    createApplicant = asyncHandler(
        async (req: Request, res: Response) => {
            const userId = new Types.ObjectId(req.user!.userId); 
            const applicant = await this.applicantService.createApplicant(
                userId,
                req.body
            );

            sendResponse(
                res,
                201,
                "Applicant profile created successfully",
                applicant
            );
        }
    );

    getApplicantById = asyncHandler(
        async (req: Request, res: Response) => {
            const id = req.params.id as string;
            const applicant = await this.applicantService.getApplicantById(id);

            sendResponse(
                res,
                200,
                "Applicant profile retrieved successfully",
                applicant
            );
        }
    );

    getMyApplicantProfile = asyncHandler(
        async (req: Request, res: Response) => {
            const userId = req.user!.userId;
            const applicant = await this.applicantService.getApplicantByUserId(userId);

            sendResponse(
                res,
                200,
                "Applicant profile retrieved successfully",
                applicant
            );
        }
    );

    updateApplicant = asyncHandler(
        async (req: Request, res: Response) => {
            const userId = req.user!.userId;
            const applicant = await this.applicantService.updateApplicant(
                userId,
                req.body
            );

            sendResponse(
                res,
                200,
                "Applicant profile updated successfully",
                applicant
            );
        }
    );

    deleteApplicant = asyncHandler(
        async (req: Request, res: Response) => {
            const userId = req.user!.userId;
            await this.applicantService.deleteApplicant(userId);

            sendResponse(
                res,
                200,
                "Applicant profile deleted successfully"
            );
        }
    );
}

export const applicantController = new ApplicantController();

export default applicantController