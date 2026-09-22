import type { Request, Response } from "express";
import { ApiError } from "../../utils/ApiError.js";
import sendResponse from "../../utils/sendResponse.js";
import employerService from "./employer.service.js";
import type {
    CreateEmployerInput,
    UpdateEmployerInput,
} from "./employer.validation.js";

class EmployerController {
    private getAuthenticatedUser(req: Request) {
        if (!req.user) {
            throw new ApiError(401, "Authentication required.");
        }

        return req.user;
    }

    createEmployer = async (
        req: Request,
        res: Response
    ): Promise<void> => {
        const user = this.getAuthenticatedUser(req);

        if (user.role !== "employer") {
            throw new ApiError(403, "Only employers can create employers.");
        }

        const employer = await employerService.createEmployer(
            user.userId,
            req.body as CreateEmployerInput
        );

        sendResponse(
            res,
            201,
            "Employer created successfully.",
            employer
        );
    };

    getEmployers = async (
        req: Request,
        res: Response
    ): Promise<void> => {
        const result = await employerService.getAllEmployers(
            req.query.page as number | undefined,
            req.query.limit as number | undefined
        );

        sendResponse(
            res,
            200,
            "Employers retrieved successfully.",
            result.employers,
            {
                page: result.pagination.page,
                limit: result.pagination.limit,
                skip: result.pagination.skip,
                totalPages: result.pagination.totalPages,
                totalItems: result.pagination.totalItems,
                hasNextPage: result.pagination.hasNextPage,
                hasPreviousPage: result.pagination.hasPreviousPage,
            }
        );
    };

    getEmployerById = async (
        req: Request,
        res: Response
    ): Promise<void> => {
        const employer = await employerService.getEmployerById(
            req.params.id as string
        );

        sendResponse(
            res,
            200,
            "Employer retrieved successfully.",
            employer
        );
    };

    updateEmployer = async (
        req: Request,
        res: Response
    ): Promise<void> => {
        const user = this.getAuthenticatedUser(req);

        const employer = await employerService.updateEmployer(
            req.params.id as string,
            user.userId,
            user.role,
            req.body as UpdateEmployerInput
        );

        sendResponse(
            res,
            200,
            "Employer updated successfully.",
            employer
        );
    };

    deleteEmployer = async (
        req: Request,
        res: Response
    ): Promise<void> => {
        const user = this.getAuthenticatedUser(req);

        await employerService.deleteEmployer(
            req.params.id as string,
            user.userId,
            user.role
        );

        sendResponse(
            res,
            200,
            "Employer deleted successfully."
        );
    };
}

export const employerController = new EmployerController();

export default employerController;