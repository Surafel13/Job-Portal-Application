import type { Request, Response } from "express";
import adminService from "./admin.service.js";
import asyncHandler from "../../utils/asyncHandler.js";
import sendResponse from "../../utils/sendResponse.js";
// import type { CreateAdminActionInput } from "./admin.validation.js";

class AdminController {
  getDashboard = asyncHandler(
    async (_req: Request, res: Response): Promise<void> => {
      const dashboard = await adminService.getDashboard();

      sendResponse(
        res,
        200,
        "Admin dashboard retrieved successfully.",
        dashboard,
      );
    },
  );

  getUserById = asyncHandler(
    async (req: Request, res: Response): Promise<void> => {
      const user = await adminService.getUserById(req.params.userId as string);

      sendResponse(res, 200, "User retrieved successfully.", user);
    },
  );

  suspendUser = asyncHandler(
    async (req: Request, res: Response): Promise<void> => {
      const user = await adminService.suspendUser(req.params.userId as string);

      sendResponse(res, 200, "User suspended successfully.", user);
    },
  );

  unsuspendUser = asyncHandler(
    async (req: Request, res: Response): Promise<void> => {
      const user = await adminService.unsuspendUser(
        req.params.userId as string,
      );

      sendResponse(res, 200, "User unsuspended successfully.", user);
    },
  );

  verifyEmployer = asyncHandler(
    async (req: Request, res: Response): Promise<void> => {
      const employer = await adminService.verifyEmployer(
        req.params.employerId as string,
      );

      sendResponse(res, 200, "Employer verified successfully.", employer);
    },
  );

  rejectEmployer = asyncHandler(
    async (req: Request, res: Response): Promise<void> => {
      const employer = await adminService.rejectEmployer(
        req.params.employerId as string,
      );

      sendResponse(res, 200, "Employer rejected successfully.", employer);
    },
  );

  suspendEmployer = asyncHandler(
    async (req: Request, res: Response): Promise<void> => {
      const employer = await adminService.suspendEmployer(
        req.params.employerId as string,
      );

      sendResponse(res, 200, "Employer suspended successfully.", employer);
    },
  );

  unsuspendEmployer = asyncHandler(
    async (req: Request, res: Response): Promise<void> => {
      const employer = await adminService.unsuspendEmployer(
        req.params.employerId as string,
      );

      sendResponse(res, 200, "Employer unsuspended successfully.", employer);
    },
  );

  publishJob = asyncHandler(
    async (req: Request, res: Response): Promise<void> => {
      const job = await adminService.publishJob(req.params.jobId as string);

      sendResponse(res, 200, "Job published successfully.", job);
    },
  );

  rejectJob = asyncHandler(
    async (req: Request, res: Response): Promise<void> => {
      const job = await adminService.rejectJob(req.params.jobId as string);

      sendResponse(res, 200, "Job rejected successfully.", job);
    },
  );

  closeJob = asyncHandler(
    async (req: Request, res: Response): Promise<void> => {
      const job = await adminService.closeJob(req.params.jobId as string);

      sendResponse(res, 200, "Job closed successfully.", job);
    },
  );

}

export const adminController = new AdminController();

export default adminController;
