import type { Request, Response } from "express";
import { ApiError } from "../../utils/ApiError.js";
import sendResponse from "../../utils/sendResponse.js";
import { companyService } from "./company.service.js";
import type {
    CreateCompanyInput,
    UpdateCompanyInput,
} from "./company.validation.js";

const getAuthenticatedUser = (req: Request) => {
    if (!req.user) {
        throw new ApiError(401, "Authentication required.");
    }

    return req.user;
};

export const createCompany = async (
    req: Request,
    res: Response
): Promise<void> => {
    const user = getAuthenticatedUser(req);

    if (user.role !== "employer") {
        throw new ApiError(403, "Only employers can create companies.");
    }

    const company = await companyService.createCompany(
        user.userId,
        req.body as CreateCompanyInput
    );

    sendResponse(res, 201, "Company created successfully.", company);
};

export const getCompanies = async (
    req: Request,
    res: Response
): Promise<void> => {
    const result = await companyService.getAllCompanies(
        req.query.page as number | undefined,
        req.query.limit as number | undefined
    );

    sendResponse(res, 200, "Companies retrieved successfully.", result.companies, {
        page: result.pagination.page,
        limit: result.pagination.limit,
        skip: result.pagination.skip,
        totalPages: result.pagination.totalPages,
        totalItems: result.pagination.totalItems,
        hasNextPage: result.pagination.hasNextPage,
        hasPreviousPage: result.pagination.hasPreviousPage,
    });
};

export const getCompanyById = async (
    req: Request,
    res: Response
): Promise<void> => {
    const company = await companyService.getCompanyById(req.params.id as string);

    sendResponse(res, 200, "Company retrieved successfully.", company);
};

export const updateCompany = async (
    req: Request,
    res: Response
): Promise<void> => {
    const user = getAuthenticatedUser(req);
    const company = await companyService.updateCompany(
        req.params.id as string,
        user.userId,
        user.role,
        req.body as UpdateCompanyInput
    );

    sendResponse(res, 200, "Company updated successfully.", company);
};

export const deleteCompany = async (
    req: Request,
    res: Response
): Promise<void> => {
    const user = getAuthenticatedUser(req);

    await companyService.deleteCompany(
        req.params.id as string,
        user.userId,
        user.role
    );

    sendResponse(res, 200, "Company deleted successfully.");
};
