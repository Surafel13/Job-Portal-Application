import { Router } from "express";
import asyncHandler from "../../utils/asyncHandler.js";
import authMiddleware from "../../middlewares/auth.middleware.js";
import { authorizeRoles } from "../../middlewares/role.middleware.js";
import {
    validateBody,
    validateParams,
    validateQuery,
} from "../../middlewares/validation.middleware.js";
import jobController from "./job.controller.js";
import {
    createJobSchema,
    updateJobSchema,
    updateJobStatusSchema,
    jobIdParamSchema,
    companyIdParamSchema,
    categoryIdParamSchema,
    jobStatusQuerySchema,
} from "./job.validation.js";

const router = Router();

router.post(
    "/",
    authMiddleware,
    authorizeRoles("employer", "admin"),
    validateBody(createJobSchema),
    asyncHandler(jobController.createJob.bind(jobController))
);

router.get(
    "/:id",
    validateParams(jobIdParamSchema),
    asyncHandler(jobController.getJobById.bind(jobController))
);

router.get(
    "/company/:companyId",
    validateParams(companyIdParamSchema),
    asyncHandler(
        jobController.getJobsByCompany.bind(jobController)
    )
);

router.get(
    "/category/:categoryId",
    validateParams(categoryIdParamSchema),
    asyncHandler(
        jobController.getJobsByCategory.bind(jobController)
    )
);

router.get(
    "/status",
    validateQuery(jobStatusQuerySchema),
    asyncHandler(
        jobController.getJobsByStatus.bind(jobController)
    )
);

router.patch(
    "/:id",
    authMiddleware,
    authorizeRoles("employer", "admin"),
    validateParams(jobIdParamSchema),
    validateBody(updateJobSchema),
    asyncHandler(jobController.updateJob.bind(jobController))
);

router.patch(
    "/status/:id",
    authMiddleware,
    authorizeRoles("employer", "admin"),
    validateParams(jobIdParamSchema),
    validateBody(updateJobStatusSchema),
    asyncHandler(
        jobController.updateJobStatus.bind(jobController)
    )
);

router.patch(
    "/:id/view",
    validateParams(jobIdParamSchema),
    asyncHandler(
        jobController.incrementJobView.bind(jobController)
    )
);

router.delete(
    "/:id",
    authMiddleware,
    authorizeRoles("employer", "admin"),
    validateParams(jobIdParamSchema),
    asyncHandler(jobController.deleteJob.bind(jobController))
);

export default router;