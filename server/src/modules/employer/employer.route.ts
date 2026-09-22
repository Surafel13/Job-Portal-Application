import { Router } from "express";

import authMiddleware from "../../middlewares/auth.middleware.js";

import {
    validateBody,
    validateParams,
    validateQuery,
} from "../../middlewares/validation.middleware.js";

import asyncHandler from "../../utils/asyncHandler.js";

import employerController from "./employer.controller.js";

import {
    employerIdParamSchema,
    employerQuerySchema,
    createEmployerSchema,
    updateEmployerSchema,
} from "./employer.validation.js";

const router = Router();

router.get(
    "/",
    validateQuery(employerQuerySchema),
    asyncHandler(employerController.getEmployers)
);

router.get(
    "/:id",
    validateParams(employerIdParamSchema),
    asyncHandler(employerController.getEmployerById)
);

router.use(authMiddleware);

router.post(
    "/",
    validateBody(createEmployerSchema),
    asyncHandler(employerController.createEmployer)
);

router.patch(
    "/:id",
    validateParams(employerIdParamSchema),
    validateBody(updateEmployerSchema),
    asyncHandler(employerController.updateEmployer)
);

router.delete(
    "/:id",
    validateParams(employerIdParamSchema),
    asyncHandler(employerController.deleteEmployer)
);

export default router;