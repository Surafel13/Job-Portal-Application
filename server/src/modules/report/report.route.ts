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
  authorizeRoles("admin"),
  validateParams(resourceParamSchema),
  reportController.getReportsByResource,
);

router.get(
  "/status",
  authorizeRoles("admin"),
  validateQuery(reportStatusQuerySchema),
  reportController.getReportsByStatus,
);

router.get(
  "/status/count",
  authorizeRoles("admin"),
  validateQuery(reportStatusQuerySchema),
  reportController.getReportCountByStatus,
);

router.get(
  "/resource/:resourceType/:resourceId/count",
  authorizeRoles("admin"),
  validateParams(resourceParamSchema),
  reportController.getResourceReportCount,
);

router.get("/", authorizeRoles("admin"), reportController.getAllReports);

router.get(
  "/:reportId",
  authorizeRoles("admin"),
  validateParams(reportIdParamSchema),
  reportController.getReportById,
);

router.patch(
  "/:reportId/review",
  authorizeRoles("admin"),
  validateParams(reportIdParamSchema),
  reportController.startReview,
);

router.patch(
  "/:reportId/resolve",
  authorizeRoles("admin"),
  validateParams(reportIdParamSchema),
  validateBody(reviewReportSchema),
  reportController.resolveReport,
);

router.patch(
  "/:reportId/reject",
  authorizeRoles("admin"),
  validateParams(reportIdParamSchema),
  validateBody(reviewReportSchema),
  reportController.rejectReport,
);

router.delete(
  "/:reportId",
  authorizeRoles("admin"),
  validateParams(reportIdParamSchema),
  reportController.deleteReport,
);

export default router;
