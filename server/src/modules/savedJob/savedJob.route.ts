import { Router } from "express";
import asyncHandler from "../../utils/asyncHandler.js";
import authMiddleware from "../../middlewares/auth.middleware.js";
import { authorizeRoles } from "../../middlewares/role.middleware.js";
import { validateParams } from "../../middlewares/validation.middleware.js";
import savedJobController from "./savedJob.controller.js";
import {
    jobIdParamSchema,
    savedJobIdParamSchema,
} from "./savedJob.validation.js";

const router = Router();

router.post(
    "/:jobId",
    authMiddleware,
    authorizeRoles("worker"),
    validateParams(jobIdParamSchema),
    asyncHandler(savedJobController.saveJob)
);

router.get(
    "/",
    authMiddleware,
    authorizeRoles("worker"),
    asyncHandler(savedJobController.getMySavedJobs)
);

router.get(
    "/:id",
    authMiddleware,
    authorizeRoles("worker"),
    validateParams(savedJobIdParamSchema),
    asyncHandler(savedJobController.getSavedJobById)
);

router.delete(
    "/:jobId",
    authMiddleware,
    authorizeRoles("worker"),
    validateParams(jobIdParamSchema),
    asyncHandler(savedJobController.removeSavedJob)
);

export default router;