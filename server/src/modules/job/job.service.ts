import { Types } from "mongoose";
import { ApiError } from "../../utils/ApiError.js";
import jobRepository from "./job.repository.js";
import EmployerRepository from "../employer/employer.repository.js";
import { CategoryRepository } from "../category/category.repository.js";
import SkillRepository from "../skill/skill.repository.js";
import embeddingService from "../ai/embedding/embedding.service.js";
import logger from "../../utils/logger.js";
import type { IJob, JobStatus } from "./job.interface.js";
import type { CreateJobInput, UpdateJobInput } from "./job.validation.js";

import type { UserRole } from "../user/user.interface.js";

export interface AuthUser {
  userId: string;
  role: UserRole;
}

const EMPLOYER_STATUSES: JobStatus[] = ["draft", "published", "closed"];

export class JobService {
  constructor(
    private readonly employerRepository: EmployerRepository,
    private readonly categoryRepository: CategoryRepository,
    private readonly skillRepository: SkillRepository,
  ) {}

  private validateObjectId(id: string, field: string): Types.ObjectId {
    if (!Types.ObjectId.isValid(id)) {
      throw new ApiError(400, `Invalid ${field}.`);
    }

    return new Types.ObjectId(id);
  }

  private async authorizeCompanyAccess(
    user: AuthUser,
    companyId: Types.ObjectId,
    options: { requireVerifiedForAdmin?: boolean } = {},
  ) {
    const employer = await this.employerRepository.findById(companyId);

    if (!employer) {
      throw new ApiError(404, "Employer not found.");
    }

    if (user.role === "admin" || user.role === "superAdmin") {
      if (
        options.requireVerifiedForAdmin &&
        employer.verificationStatus !== "verified"
      ) {
        throw new ApiError(
          403,
          "Employer must be verified before posting a job.",
        );
      }
      return employer;
    }

    if (user.role !== "employer") {
      throw new ApiError(403, "You do not have permission to manage jobs.");
    }

    const isRecruiter = employer.recruiters.some(
      (recruiterId) => recruiterId.toString() === user.userId,
    );

    if (!isRecruiter) {
      throw new ApiError(403, "You do not manage this employer.");
    }

    if (employer.verificationStatus !== "verified") {
      throw new ApiError(
        403,
        "Your employer account must be verified before you can create, edit, or publish jobs.",
      );
    }

    return employer;
  }

  private async validateReferences(
    employerId: Types.ObjectId,
    categoryId: Types.ObjectId,
    skillIds: Types.ObjectId[],
  ): Promise<void> {
    const employerExists = await this.employerRepository.existsById(employerId);

    if (!employerExists) {
      throw new ApiError(404, "Employer not found.");
    }

    const categoryExists = await this.categoryRepository.existsById(categoryId);

    if (!categoryExists) {
      throw new ApiError(404, "Category not found.");
    }

    if (skillIds.length === 0) {
      return;
    }

    const uniqueSkillIds = [
      ...new Set(skillIds.map((skillId) => skillId.toString())),
    ].map((skillId) => new Types.ObjectId(skillId));

    const skillCount = await this.skillRepository.countByIds(uniqueSkillIds);

    if (skillCount !== uniqueSkillIds.length) {
      throw new ApiError(404, "One or more skills were not found.");
    }
  }

  async createJob(user: AuthUser, data: CreateJobInput): Promise<IJob> {
    if (data.deadline && data.deadline <= new Date()) {
      throw new ApiError(400, "Job deadline must be in the future.");
    }

    if (
      data.salary?.minimum !== undefined &&
      data.salary?.maximum !== undefined &&
      data.salary.minimum > data.salary.maximum
    ) {
      throw new ApiError(
        400,
        "Minimum salary cannot be greater than maximum salary.",
      );
    }

    const employerId = this.validateObjectId(data.companyId, "employer ID");

    await this.authorizeCompanyAccess(user, employerId, {
      requireVerifiedForAdmin: true,
    });

    if (
      user.role === "employer" &&
      data.status !== "draft" &&
      data.status !== "published"
    ) {
      throw new ApiError(
        403,
        "Employers can only create jobs as draft or published.",
      );
    }

    const categoryId = this.validateObjectId(data.categoryId, "category ID");
    const skillIds = data.skills.map((skillId) =>
      this.validateObjectId(skillId, "skill ID"),
    );

    await this.validateReferences(employerId, categoryId, skillIds);

    const status = data.status ?? "draft";

    const jobData: IJob = {
      ...data,
      companyId: employerId,
      categoryId,
      skills: skillIds,
      status,
      viewCount: 0,
      ...(status === "published"
        ? { publishedAt: new Date() }
        : { publishedAt: undefined }),
    };

    const job = await jobRepository.create(jobData);
    await this.syncJobEmbedding(job);
    return job;
  }

  async getJobById(jobId: string): Promise<IJob> {
    const job = await jobRepository.findById(jobId);

    if (!job) {
      throw new ApiError(404, "Job not found.");
    }

    return job;
  }

  async getJobsByCompany(companyId: Types.ObjectId): Promise<IJob[]> {
    const employerExists = await this.employerRepository.existsById(companyId);

    if (!employerExists) {
      throw new ApiError(404, "Employer not found.");
    }

    return jobRepository.findByCompany(companyId);
  }

  async getJobsByCategory(categoryId: Types.ObjectId): Promise<IJob[]> {
    const categoryExists = await this.categoryRepository.existsById(categoryId);

    if (!categoryExists) {
      throw new ApiError(404, "Category not found.");
    }

    return jobRepository.findByCategory(categoryId);
  }

  async getJobsByStatus(status: JobStatus): Promise<IJob[]> {
    return jobRepository.findByStatus(status);
  }

  async     updateJob(jobId: string, data: UpdateJobInput): Promise<IJob> {
    if (data.deadline && data.deadline <= new Date()) {
      throw new ApiError(400, "Job deadline must be in the future.");
    }

    if (
      data.salary?.minimum !== undefined &&
      data.salary?.maximum !== undefined &&
      data.salary.minimum > data.salary.maximum
    ) {
      throw new ApiError(
        400,
        "Minimum salary cannot be greater than maximum salary.",
      );
    }

    const existingJob = await jobRepository.findById(jobId);

    if (!existingJob) {
      throw new ApiError(404, "Job not found.");
    }

    const updateData: Partial<IJob> = {
      ...(data.title !== undefined && {
        title: data.title,
      }),
      ...(data.description !== undefined && {
        description: data.description,
      }),
      ...(data.requirements !== undefined && {
        requirements: data.requirements,
      }),
      ...(data.responsibilities !== undefined && {
        responsibilities: data.responsibilities,
      }),
      ...(data.location !== undefined && {
        location: data.location,
      }),
      ...(data.employmentType !== undefined && {
        employmentType: data.employmentType,
      }),
      ...(data.salary !== undefined && {
        salary: data.salary,
      }),
      ...(data.experienceLevel !== undefined && {
        experienceLevel: data.experienceLevel,
      }),
      ...(data.educationLevel !== undefined && {
        educationLevel: data.educationLevel,
      }),
      ...(data.deadline !== undefined && {
        deadline: data.deadline,
      }),
    };

    if (data.categoryId !== undefined) {
      const categoryId = this.validateObjectId(data.categoryId, "category ID");

      const categoryExists =
        await this.categoryRepository.existsById(categoryId);

      if (!categoryExists) {
        throw new ApiError(404, "Category not found.");
      }

      updateData.categoryId = categoryId;
    }

    if (data.skills !== undefined) {
      const skillIds = data.skills.map((skillId) =>
        this.validateObjectId(skillId, "skill ID"),
      );

      await this.validateSkills(skillIds);

      updateData.skills = skillIds;
    }

    const job = await jobRepository.updateById(jobId, updateData);

    if (!job) {
      throw new ApiError(404, "Job not found.");
    }

    await this.syncJobEmbedding(job);
    return job;
  }

  private async validateSkills(skillIds: Types.ObjectId[]): Promise<void> {
    if (skillIds.length === 0) {
      return;
    }

    const uniqueSkillIds = [
      ...new Set(skillIds.map((skillId) => skillId.toString())),
    ].map((skillId) => new Types.ObjectId(skillId));

    const skillCount = await this.skillRepository.countByIds(uniqueSkillIds);

    if (skillCount !== uniqueSkillIds.length) {
      throw new ApiError(404, "One or more skills were not found.");
    }
  }

  async updateJobStatus(
    user: AuthUser,
    jobId: string,
    status: JobStatus,
  ): Promise<IJob> {
    const existingJob = await jobRepository.findById(jobId);

    if (!existingJob) {
      throw new ApiError(404, "Job not found.");
    }

    await this.authorizeCompanyAccess(user, existingJob.companyId);

    if (user.role === "employer") {
      if (!EMPLOYER_STATUSES.includes(status)) {
        throw new ApiError(403, `Employers cannot set a job to "${status}".`);
      }
      if (existingJob.status === "rejected") {
        throw new ApiError(
          403,
          "This job was rejected by an administrator and cannot be changed.",
        );
      }
    }

    if (
      status === "published" &&
      existingJob.deadline &&
      existingJob.deadline <= new Date()
    ) {
      throw new ApiError(
        400,
        "Cannot publish a job whose deadline has passed. Update the deadline first.",
      );
    }

    const job = await jobRepository.updateById(jobId, {
      status,
      ...(status === "published"
        ? { publishedAt: existingJob.publishedAt ?? new Date() }
        : {}),
    });

    if (!job) {
      throw new ApiError(404, "Job not found.");
    }

    return job;
  }

  async incrementJobView(jobId: string): Promise<IJob> {
    const job = await jobRepository.incrementViewCount(jobId);

    if (!job) {
      throw new ApiError(404, "Job not found.");
    }

    return job;
  }

  async deleteJob(user: AuthUser, jobId: string): Promise<void> {
    const existingJob = await jobRepository.findById(jobId);

    if (!existingJob) {
      throw new ApiError(404, "Job not found.");
    }

    await this.authorizeCompanyAccess(user, existingJob.companyId);

    const deleted = await jobRepository.deleteById(jobId);

    if (!deleted) {
      throw new ApiError(404, "Job not found.");
    }

    try {
      await embeddingService.removeJobIndex(jobId);
    } catch (error) {
      logger.error(
        `Failed to remove the job embedding for ${jobId}: ${
          error instanceof Error
            ? (error.stack ?? error.message)
            : String(error)
        }`,
      );
    }
  }

  private async syncJobEmbedding(job: IJob): Promise<void> {
    try {
      await embeddingService.indexJob(job);
    } catch (error) {
      logger.error(
        `Failed to update the semantic-search embedding for job ${
          job._id?.toString() ?? "unknown"
        }: ${error instanceof Error ? (error.stack ?? error.message) : String(error)}`,
      );
    }
  }
}

export const jobService = new JobService(
  new EmployerRepository(),
  new CategoryRepository(),
  new SkillRepository(),
);

export default jobService;
