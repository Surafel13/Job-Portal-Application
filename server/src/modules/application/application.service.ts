import { Types } from "mongoose";
import { ApplicationRepository } from "./application.repository.js";
import { ApplicantRepository } from "../applicant/applicant.repository.js";
import ResumeRepository from "../resume/resume.repository.js";
import jobRepository from "../job/job.repository.js";
import WorkerRepository from "../worker/worker.repository.js";
import EmployerRepository from "../employer/employer.repository.js";
import { ApiError } from "../../utils/ApiError.js";
import type { IApplication } from "./application.interface.js";
import type { CreateApplicationInput } from "./application.validation.js";
import {
    calculateWorkerProfileCompletion,
    MIN_PROFILE_COMPLETION_TO_APPLY,
} from "../worker/worker.completion.js";
import type { IApplicant } from "../applicant/applicant.interface.js";
import type { IJob } from "../job/job.interface.js";
import type { IEmployer } from "../employer/employer.interface.js";

const isDuplicateKeyError = (error: unknown): boolean =>
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    (error as { code: number }).code === 11000;

const toIdString = (value: unknown): string => {
    if (!value) {
        return "";
    }

    if (typeof value === "string") {
        return value;
    }

    if (value instanceof Types.ObjectId) {
        return value.toString();
    }

    if (typeof value === "object" && "_id" in value) {
        return String((value as { _id: unknown })._id);
    }

    return String(value);
};

export class ApplicationService {
    constructor(
        private readonly applicationRepository = new ApplicationRepository(),
        private readonly applicantRepository = new ApplicantRepository(),
        private readonly resumeRepository = new ResumeRepository(),
        private readonly workerRepository = new WorkerRepository(),
        private readonly employerRepository = new EmployerRepository(),
        private readonly jobs = jobRepository
    ) {}

    private async getApplicant(userId: string) {
        const applicant = await this.applicantRepository.findByUserId(userId);

        if (!applicant) {
            throw new ApiError(404, "Applicant profile not found");
        }

        return applicant;
    }

    private async ensureEligibleWorker(userId: string) {
        const worker = await this.workerRepository.findByUserId(userId);

        if (!worker) {
            throw new ApiError(404, "Worker profile not found");
        }

        const profileCompletion = calculateWorkerProfileCompletion(worker);

        if (profileCompletion < MIN_PROFILE_COMPLETION_TO_APPLY) {
            throw new ApiError(
                403,
                `Complete at least ${MIN_PROFILE_COMPLETION_TO_APPLY}% of your profile before applying for jobs.`
            );
        }

        return worker;
    }

    private async getPublishedJob(jobId: string): Promise<IJob> {
        const job = await this.jobs.findById(jobId);

        if (!job) {
            throw new ApiError(404, "Job not found");
        }

        if (job.status !== "published") {
            throw new ApiError(400, "This job is not accepting applications");
        }

        if (job.deadline && new Date(job.deadline).getTime() < Date.now()) {
            throw new ApiError(
                400,
                "The application deadline for this job has passed"
            );
        }

        return job;
    }

    private async assertEmployerOwnsJob(
        job: IJob,
        userId: string
    ): Promise<IEmployer> {
        const employer = await this.employerRepository.findById(job.companyId);

        if (!employer) {
            throw new ApiError(404, "Employer not found");
        }

        const isRecruiter = employer.recruiters.some(
            (recruiterId) => recruiterId.toString() === userId
        );

        if (!isRecruiter) {
            throw new ApiError(
                403,
                "You are not allowed to manage these applications"
            );
        }

        return employer;
    }

    private async ensureApplicantForWorker(
        userId: string,
        resumeId: Types.ObjectId
    ): Promise<IApplicant> {
        const existingApplicant =
            await this.applicantRepository.findByUserId(userId);

        if (existingApplicant) {
            if (existingApplicant.status !== "active") {
                throw new ApiError(403, "Your applicant profile is not active");
            }

            return existingApplicant;
        }

        return this.applicantRepository.create({
            userId: new Types.ObjectId(userId),
            resumeId,
            skills: [],
            status: "active",
        });
    }

    async createApplication(
        userId: string,
        jobId: string,
        data: CreateApplicationInput
    ) {
        const worker = await this.ensureEligibleWorker(userId);
        const job = await this.getPublishedJob(jobId);

        const resume = await this.resumeRepository.findById(data.resumeId);

        if (!resume) {
            throw new ApiError(404, "Resume not found");
        }

        if (resume.userId.toString() !== userId) {
            throw new ApiError(403, "You can only use your own resume");
        }

        if (
            !worker._id ||
            resume.workerId.toString() !== worker._id.toString()
        ) {
            throw new ApiError(403, "You can only use a resume from your worker profile");
        }

        const resumeId = resume._id ?? new Types.ObjectId(data.resumeId);
        const applicant = await this.ensureApplicantForWorker(userId, resumeId);

        const existingApplication =
            await this.applicationRepository.findByApplicantAndJob(
                applicant._id!.toString(),
                job._id!.toString()
            );

        if (existingApplication) {
            throw new ApiError(409, "You have already applied for this job");
        }

        try {
            return await this.applicationRepository.create({
                applicantId: applicant._id!,
                jobId: job._id!,
                resumeId,
                coverLetter: data.coverLetter,
                status: "pending",
            });
        } catch (error) {
            if (isDuplicateKeyError(error)) {
                throw new ApiError(409, "You have already applied for this job");
            }

            throw error;
        }
    }

    async getApplicationById(id: string) {
        const application = await this.applicationRepository.findById(id);

        if (!application) {
            throw new ApiError(404, "Application not found");
        }

        return application;
    }

    async getMyApplications(userId: string) {
        const applicant = await this.applicantRepository.findByUserId(userId);

        if (!applicant?._id) {
            return [];
        }

        return this.applicationRepository.findByApplicantId(
            applicant._id.toString()
        );
    }

    async getJobApplications(jobId: string, userId: string) {
        const job = await this.jobs.findById(jobId);

        if (!job) {
            throw new ApiError(404, "Job not found");
        }

        await this.assertEmployerOwnsJob(job, userId);

        return this.applicationRepository.findByJobId(job._id!.toString());
    }

    async updateApplicationStatus(
        id: string,
        status: Exclude<IApplication["status"], "withdrawn">,
        userId: string
    ) {
        const application = await this.applicationRepository.findRawById(id);

        if (!application) {
            throw new ApiError(404, "Application not found");
        }

        const job = await this.jobs.findById(toIdString(application.jobId));

        if (!job) {
            throw new ApiError(404, "Job not found");
        }

        await this.assertEmployerOwnsJob(job, userId);

        if (application.status === "withdrawn") {
            throw new ApiError(
                400,
                "Withdrawn applications cannot change status"
            );
        }

        return this.applicationRepository.updateById(id, { status });
    }

    async withdrawApplication(userId: string, id: string) {
        const applicant = await this.getApplicant(userId);
        const application = await this.applicationRepository.findRawById(id);

        if (!application) {
            throw new ApiError(404, "Application not found");
        }

        if (toIdString(application.applicantId) !== applicant._id!.toString()) {
            throw new ApiError(403, "You can only withdraw your own application");
        }

        if (
            application.status === "accepted" ||
            application.status === "rejected" ||
            application.status === "withdrawn"
        ) {
            throw new ApiError(400, "This application can no longer be withdrawn");
        }

        return this.applicationRepository.updateById(id, { status: "withdrawn" });
    }
}
