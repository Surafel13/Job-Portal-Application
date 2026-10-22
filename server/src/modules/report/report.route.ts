import { Router } from "express";
import reportController from "./report.controller.js";
import authMiddleware from "../../middlewares/auth.middleware.js";
import authorizeRoles from "../../middlewares/role.middleware.js";
import {
  validateBody,
  validateParams,
  validateQuery,
} from "../../middlewares/validation.middleware.js";
import {
  createReportSchema,
  reportIdParamSchema,
  resourceParamSchema,
  reportStatusQuerySchema,
  reviewReportSchema,
} from "./report.validation.js";

const router = Router();

const moderators = ["admin", "superAdmin"] as const;

router.use(authMiddleware);

router.post(
  "/",
  authorizeRoles("worker", "employer"),
  validateBody(createReportSchema),
  reportController.createReport,
);

router.get(
  "/my",
  authorizeRoles("worker", "employer"),
  reportController.getMyReports,
);

router.get(
  "/resource/:resourceType/:resourceId",
  authorizeRoles(...moderators),
  validateParams(resourceParamSchema),
  reportController.getReportsByResource,
);

router.get(
  "/status",
  authorizeRoles(...moderators),
  validateQuery(reportStatusQuerySchema),
  reportController.getReportsByStatus,
);

router.get(
  "/status/count",
  authorizeRoles(...moderators),
  validateQuery(reportStatusQuerySchema),
  reportController.getReportCountByStatus,
);

router.get(
  "/resource/:resourceType/:resourceId/count",
  authorizeRoles(...moderators),
  validateParams(resourceParamSchema),
  reportController.getResourceReportCount,
);

router.get("/", authorizeRoles(...moderators), reportController.getAllReports);

router.get(
  "/:reportId",
  authorizeRoles(...moderators),
  validateParams(reportIdParamSchema),
  reportController.getReportById,
);

router.patch(
  "/:reportId/review",
  authorizeRoles(...moderators),
  validateParams(reportIdParamSchema),
  reportController.startReview,
);

router.patch(
  "/:reportId/resolve",
  authorizeRoles(...moderators),
  validateParams(reportIdParamSchema),
  validateBody(reviewReportSchema),
  reportController.resolveReport,
);

router.patch(
  "/:reportId/reject",
  authorizeRoles(...moderators),
  validateParams(reportIdParamSchema),
  validateBody(reviewReportSchema),
  reportController.rejectReport,
);

// Destructive: super admins only
router.delete(
  "/:reportId",
  authorizeRoles("superAdmin"),
  validateParams(reportIdParamSchema),
  reportController.deleteReport,
);

export default router;
