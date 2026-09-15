import { Router } from "express";
import {
    validateBody,
    validateParams,
    validateQuery,
} from "../../middlewares/validation.middleware.js";
import asyncHandler from "../../utils/asyncHandler.js";
import {
    createSkill,
    deleteSkill,
    getSkillById,
    getSkills,
    updateSkill,
} from "./skill.controller.js";
import {
    createSkillSchema,
    skillIdParamSchema,
    skillQuerySchema,
    updateSkillSchema,
} from "./skill.validation.js";

const router = Router();

router.post(
    "/",
    validateBody(createSkillSchema),
    asyncHandler(createSkill)
);

router.get(
    "/",
    validateQuery(skillQuerySchema),
    asyncHandler(getSkills)
);

router.get(
    "/:id",
    validateParams(skillIdParamSchema),
    asyncHandler(getSkillById)
);

router.patch(
    "/:id",
    validateParams(skillIdParamSchema),
    validateBody(updateSkillSchema),
    asyncHandler(updateSkill)
);

router.delete(
    "/:id",
    validateParams(skillIdParamSchema),
    asyncHandler(deleteSkill)
);

export default router;
