import Router from "express";
import applicationController from "./application.controller.js";
import authMiddleware from "../../middlewares/auth.middleware.js";
import authorizeRoles from "../../middlewares/role.middleware.js";
import {
    validateBody,
    validateParams,
} from "../../middlewares/validation.middleware.js";
import {
    createApplicationSchema,
    updateApplicationStatusSchema,
    applicationIdSchema,
    jobIdSchema,
} from "./application.validation.js";

const router = Router();

router.post(
    "/job/:jobId",
    authMiddleware,
    authorizeRoles("worker"),
    validateParams(jobIdSchema),
    validateBody(createApplicationSchema),
    applicationController.createApplication
);

router.get(
    "/my",
    authMiddleware,
    authorizeRoles("worker"),
    applicationController.getMyApplications
);

router.get(
    "/job/:jobId",
    authMiddleware,
    authorizeRoles("employer"),
    validateParams(jobIdSchema),
    applicationController.getJobApplications
);

router.get(
    "/:id",
    authMiddleware,
    authorizeRoles("admin", "superAdmin"),
    validateParams(applicationIdSchema),
    applicationController.getApplicationById
);

router.patch(
    "/:id/status",
    authMiddleware,
    authorizeRoles("employer"),
    validateParams(applicationIdSchema),
    validateBody(updateApplicationStatusSchema),
    applicationController.updateApplicationStatus
);

router.patch(
    "/:id/withdraw",
    authMiddleware,
    authorizeRoles("worker"),
    validateParams(applicationIdSchema),
    applicationController.withdrawApplication
);

export default router;
