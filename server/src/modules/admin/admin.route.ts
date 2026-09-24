import { Router } from "express";
import adminController from "./admin.controller.js";
import {
    validateBody,
    validateParams,
} from "../../middlewares/validation.middleware.js";
import authMiddleware from "../../middlewares/auth.middleware.js";
import authorizeRoles from "../../middlewares/role.middleware.js";
import {
    userIdParamSchema,
    employerIdParamSchema,
    jobIdParamSchema,
} from "./admin.validation.js";

const router = Router();

router.use(
    authMiddleware,
    authorizeRoles("admin")
);

router.get(
    "/dashboard",
    adminController.getDashboard
);

router.get(
    "/users/:userId",
    validateParams(userIdParamSchema),
    adminController.getUserById
);

router.patch(
    "/users/:userId/suspend",
    validateParams(userIdParamSchema),
    adminController.suspendUser
);

router.patch(
    "/users/:userId/unsuspend",
    validateParams(userIdParamSchema),
    adminController.unsuspendUser
);

router.patch(
    "/employers/:employerId/verify",
    validateParams(employerIdParamSchema),
    adminController.verifyEmployer
);

router.patch(
    "/employers/:employerId/reject",
    validateParams(employerIdParamSchema),
    adminController.rejectEmployer
);

router.patch(
    "/employers/:employerId/suspend",
    validateParams(employerIdParamSchema),
    adminController.suspendEmployer
);

router.patch(
    "/employers/:employerId/unsuspend",
    validateParams(employerIdParamSchema),
    adminController.unsuspendEmployer
);

router.patch(
    "/jobs/:jobId/publish",
    validateParams(jobIdParamSchema),
    adminController.publishJob
);

router.patch(
    "/jobs/:jobId/reject",
    validateParams(jobIdParamSchema),
    adminController.rejectJob
);

router.patch(
    "/jobs/:jobId/close",
    validateParams(jobIdParamSchema),
    adminController.closeJob
);


export default router;