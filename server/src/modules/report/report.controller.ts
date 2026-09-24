import type { Request, Response } from "express";
import reportService from "./report.service.js";
import asyncHandler from "../../utils/asyncHandler.js";
import sendResponse from "../../utils/sendResponse.js";
import { ApiError } from "../../utils/ApiError.js";
import type { ReportResourceType, ReportStatus } from "./report.interface.js";

class ReportController {
  createReport = asyncHandler(async (req: Request, res: Response) => {
    if (!req.user?.userId) {
      throw new ApiError(401, "Authentication required.");
    }

    const report = await reportService.createReport({
      reporterId: req.user.userId,
      resourceType: req.body.resourceType,
      resourceId: req.body.resourceId,
      reason: req.body.reason,
      description: req.body.description,
    });

    sendResponse(res, 201, "Report created successfully.", report);
  });

  getReportById = asyncHandler(async (req: Request, res: Response) => {
    const report = await reportService.getReportById(
      req.params.reportId as string,
    );

    sendResponse(res, 200, "Report retrieved successfully.", report);
  });

  getMyReports = asyncHandler(async (req: Request, res: Response) => {
    if (!req.user?.userId) {
      throw new ApiError(401, "Authentication required.");
    }

    const reports = await reportService.getMyReports(req.user.userId);

    sendResponse(res, 200, "Reports retrieved successfully.", reports);
  });

  getReportsByResource = asyncHandler(async (req: Request, res: Response) => {
    const reports = await reportService.getReportsByResource(
      req.params.resourceType as ReportResourceType,
      req.params.resourceId as string,
    );

    sendResponse(res, 200, "Reports retrieved successfully.", reports);
  });

  getReportsByStatus = asyncHandler(async (req: Request, res: Response) => {
    const reports = await reportService.getReportsByStatus(
      req.query.status as ReportStatus,
    );

    sendResponse(res, 200, "Reports retrieved successfully.", reports);
  });

  getAllReports = asyncHandler(async (_req: Request, res: Response) => {
    const reports = await reportService.getAllReports();

    sendResponse(res, 200, "Reports retrieved successfully.", reports);
  });

  startReview = asyncHandler(async (req: Request, res: Response) => {
    if (!req.user?.userId) {
      throw new ApiError(401, "Authentication required.");
    }

    const report = await reportService.startReview(
      req.params.reportId as string,
      req.user.userId,
    );

    sendResponse(res, 200, "Report review started successfully.", report);
  });

  resolveReport = asyncHandler(async (req: Request, res: Response) => {
    if (!req.user?.userId) {
      throw new ApiError(401, "Authentication required.");
    }

    const report = await reportService.resolveReport(
      req.params.reportId as string,
      req.user.userId,
      req.body.adminDecision,
    );

    sendResponse(res, 200, "Report resolved successfully.", report);
  });

  rejectReport = asyncHandler(async (req: Request, res: Response) => {
    if (!req.user?.userId) {
      throw new ApiError(401, "Authentication required.");
    }

    const report = await reportService.rejectReport(
      req.params.reportId as string,
      req.user.userId,
      req.body.adminDecision,
    );

    sendResponse(res, 200, "Report rejected successfully.", report);
  });

  deleteReport = asyncHandler(async (req: Request, res: Response) => {
    await reportService.deleteReport(req.params.reportId as string);

    sendResponse(res, 200, "Report deleted successfully.");
  });

  getReportCountByStatus = asyncHandler(async (req: Request, res: Response) => {
    const count = await reportService.getReportCountByStatus(
      req.query.status as ReportStatus,
    );

    sendResponse(res, 200, "Report count retrieved successfully.", { count });
  });

  getResourceReportCount = asyncHandler(async (req: Request, res: Response) => {
    const count = await reportService.getResourceReportCount(
      req.params.resourceType as ReportResourceType,
      req.params.resourceId as string,
    );

    sendResponse(res, 200, "Resource report count retrieved successfully.", {
      count,
    });
  });
}

export const reportController = new ReportController();

export default reportController;
