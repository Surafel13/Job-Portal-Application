import type { Request, Response } from "express";
import { ApplicationService } from "./application.service.js";
import asyncHandler from "../../utils/asyncHandler.js";
import sendResponse from "../../utils/sendResponse.js";

class ApplicationController {
    
    private applicationService = new ApplicationService()

    createApplication = asyncHandler(
        async (req: Request, res: Response) => {
            const application =
                await this.applicationService.createApplication(
                    req.user!.userId,
                    req.params.jobId as string,
                    req.body
                );

            sendResponse(
                res,
                201,
                "Application submitted successfully",
                application
            );
        }
    );

    getApplicationById = asyncHandler(
        async (req: Request, res: Response) => {
            const application =
                await this.applicationService.getApplicationById(
                    req.params.id as string
                );

            sendResponse(
                res,
                200,
                "Application retrieved successfully",
                application
            );
        }
    );

    getMyApplications = asyncHandler(
        async (req: Request, res: Response) => {
            const applications =
                await this.applicationService.getMyApplications(
                    req.user!.userId
                );

            sendResponse(
                res,
                200,
                "Applications retrieved successfully",
                applications
            );
        }
    );

    getJobApplications = asyncHandler(
        async (req: Request, res: Response) => {
            const applications =
                await this.applicationService.getJobApplications(
                    req.params.jobId as string,
                    req.user!.userId
                );

            sendResponse(
                res,
                200,
                "Job applications retrieved successfully",
                applications
            );
        }
    );

    updateApplicationStatus = asyncHandler(
        async (req: Request, res: Response) => {
            const application =
                await this.applicationService.updateApplicationStatus(
                    req.params.id as string,
                    req.body.status
                );

            sendResponse(
                res,
                200,
                "Application status updated successfully",
                application
            );
        }
    );

    withdrawApplication = asyncHandler(
        async (req: Request, res: Response) => {
            const application =
                await this.applicationService.withdrawApplication(
                    req.user!.userId,
                    req.params.id as string
                );

            sendResponse(
                res,
                200,
                "Application withdrawn successfully",
                application
            );
        }
    );

}

const applicationController = new ApplicationController();

export default applicationController;