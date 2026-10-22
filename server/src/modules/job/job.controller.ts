import type { Request, Response } from "express";
import { Types } from "mongoose";
import jobService from "./job.service.js";
import type { AuthUser } from "./job.service.js";
import sendResponse from "../../utils/sendResponse.js";
import { ApiError } from "../../utils/ApiError.js";
import type {
  CreateJobInput,
  UpdateJobInput,
  UpdateJobStatusInput,
  JobStatusQueryInput,
} from "./job.validation.js";

class JobController {
  private getUser(req: Request): AuthUser {
    if (!req.user) {
      throw new ApiError(401, "Authentication required.");
    }

    return req.user;
  }

  async createJob(req: Request, res: Response): Promise<void> {
    const job = await jobService.createJob(
      this.getUser(req),
      req.body as CreateJobInput,
    );

    sendResponse(res, 201, "Job created successfully.", job);
  }

  async getJobById(req: Request, res: Response): Promise<void> {
    const jobId = req.params.id as string;

    const job = await jobService.getJobById(jobId);

    sendResponse(res, 200, "Job retrieved successfully.", job);
  }

  async getJobsByCompany(req: Request, res: Response): Promise<void> {
    const companyId = new Types.ObjectId(req.params.companyId as string);

    const jobs = await jobService.getJobsByCompany(companyId);

    sendResponse(res, 200, "Company jobs retrieved successfully.", jobs);
  }

  async getJobsByCategory(req: Request, res: Response): Promise<void> {
    const categoryId = new Types.ObjectId(req.params.categoryId as string);

    const jobs = await jobService.getJobsByCategory(categoryId);

    sendResponse(res, 200, "Category jobs retrieved successfully.", jobs);
  }

  async getJobsByStatus(req: Request, res: Response): Promise<void> {
    const { status } = req.query as unknown as JobStatusQueryInput;

    const jobs = await jobService.getJobsByStatus(status);

    sendResponse(res, 200, "Jobs retrieved successfully.", jobs);
  }

  async updateJob(req: Request, res: Response): Promise<void> {
    const job = await jobService.updateJob(
      req.params.id as string,
      req.body as UpdateJobInput,
    );

    sendResponse(res, 200, "Job updated successfully.", job);
  }

  async updateJobStatus(req: Request, res: Response): Promise<void> {
    const { status } = req.body as UpdateJobStatusInput;

    const job = await jobService.updateJobStatus(
      this.getUser(req),
      req.params.id as string,
      status,
    );

    sendResponse(res, 200, "Job status updated successfully.", job);
  }

  async incrementJobView(req: Request, res: Response): Promise<void> {
    const jobId = req.params.id as string;

    const job = await jobService.incrementJobView(jobId);

    sendResponse(res, 200, "Job view count updated successfully.", job);
  }

  async deleteJob(req: Request, res: Response): Promise<void> {
    await jobService.deleteJob(this.getUser(req), req.params.id as string);

    sendResponse(res, 200, "Job deleted successfully.");
  }
}

export const jobController = new JobController();

export default jobController;
