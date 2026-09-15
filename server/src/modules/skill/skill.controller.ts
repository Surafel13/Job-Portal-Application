import type { Request, Response } from "express";
import sendResponse from "../../utils/sendResponse.js";
import { skillService } from "./skill.service.js";
import type {
    CreateSkillInput,
    UpdateSkillInput,
} from "./skill.validation.js";

export const createSkill = async (
    req: Request,
    res: Response
): Promise<void> => {
    const skill = await skillService.createSkill(
        req.body as CreateSkillInput
    );

    sendResponse(res, 201, "Skill created successfully.", skill);
};

export const getSkills = async (
    req: Request,
    res: Response
): Promise<void> => {
    const result = await skillService.getAllSkills(
        req.query.page as number | undefined,
        req.query.limit as number | undefined
    );

    sendResponse(res, 200, "Skills retrieved successfully.", result.skills, {
        page: result.pagination.page,
        limit: result.pagination.limit,
        skip: result.pagination.skip,
        totalPages: result.pagination.totalPages,
        totalItems: result.pagination.totalItems,
        hasNextPage: result.pagination.hasNextPage,
        hasPreviousPage: result.pagination.hasPreviousPage,
    });
};

export const getSkillById = async (
    req: Request,
    res: Response
): Promise<void> => {
    const skill = await skillService.getSkillById(req.params.id as string);

    sendResponse(res, 200, "Skill retrieved successfully.", skill);
};

export const updateSkill = async (
    req: Request,
    res: Response
): Promise<void> => {
    const skill = await skillService.updateSkill(
        req.params.id as string,
        req.body as UpdateSkillInput
    );

    sendResponse(res, 200, "Skill updated successfully.", skill);
};

export const deleteSkill = async (
    req: Request,
    res: Response
): Promise<void> => {
    await skillService.deleteSkill(req.params.id as string);

    sendResponse(res, 200, "Skill deleted successfully.");
};
