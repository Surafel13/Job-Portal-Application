import { ApplicationRepository } from "./application.repository.js";
import { ApplicantRepository } from "../applicant/applicant.repository.js";
import ResumeRepository from "../resume/resume.repository.js";
import jobRepository from "../job/job.repository.js";
import { ApiError } from "../../utils/ApiError.js";
import type { IApplication } from "./application.interface.js";

export class ApplicationService {
    private applicationRepository = new ApplicationRepository();
    private applicantRepository = new ApplicantRepository();
    private resumeRepository = new ResumeRepository();
    private jobRepository = jobRepository;

    async createApplication(
        userId: string,
        jobId: string,
        data: Omit<IApplication, "applicantId" | "jobId">
    ) {
        const applicant =
            await this.applicantRepository.findByUserId(userId);

        if (!applicant) {
            throw new ApiError(
                404,
                "Please create your applicant profile first"
            );
        }

        if (applicant.status !== "active") {
            throw new ApiError(
                403,
                "Your applicant profile is not active"
            );
        }

        const job =
            await this.jobRepository.findById(jobId);

        if (!job) {
            throw new ApiError(
                404,
                "Job not found"
            );
        }

        if (job.status !== "published") {
            throw new ApiError(
                400,
                "This job is not accepting applications"
            );
        }

        const existingApplication =
            await this.applicationRepository.findByApplicantAndJob(
                applicant._id!.toString(),
                job._id!.toString()
            );

        if (existingApplication) {
            throw new ApiError(
                409,
                "You have already applied for this job"
            );
        }

        if (!data.resumeId) {
            throw new ApiError(
                400,
                "Resume is required to apply for a job"
            );
        }

        const resume =
            await this.resumeRepository.findById(
                data.resumeId.toString()
            );

        if (!resume) {
            throw new ApiError(
                404,
                "Resume not found"
            );
        }

        if (resume.userId.toString() !== userId) {
            throw new ApiError(
                403,
                "You can only use your own resume"
            );
        }

        return this.applicationRepository.create({
            ...data,
            applicantId: applicant._id!,
            jobId: job._id!,
        });
    }

    async getApplicationById(id: string) {
        const application =
            await this.applicationRepository.findById(id);

        if (!application) {
            throw new ApiError(
                404,
                "Application not found"
            );
        }

        return application;
    }

    async getMyApplications(userId: string) {
        const applicant =
            await this.applicantRepository.findByUserId(userId);

        if (!applicant) {
            throw new ApiError(
                404,
                "Applicant profile not found"
            );
        }

        return this.applicationRepository.findByApplicantId(
            applicant._id!.toString()
        );
    }

    async getJobApplications(
        jobId: string,
        userId: string
    ) {
        const job =
            await this.jobRepository.findById(jobId);

        if (!job) {
            throw new ApiError(
                404,
                "Job not found"
            );
        }

        if (job.companyId.toString() !== userId) {
            throw new ApiError(
                403,
                "You are not allowed to view these applications"
            );
        }

        return this.applicationRepository.findByJobId(
            job._id!.toString()
        );
    }

    async updateApplicationStatus(
        id: string,
        status: IApplication["status"]
    ) {
        const application =
            await this.applicationRepository.findById(id);

        if (!application) {
            throw new ApiError(
                404,
                "Application not found"
            );
        }

        return this.applicationRepository.updateById(
            id,
            { status }
        );
    }

    async withdrawApplication(
        userId: string,
        id: string
    ) {
        const applicant =
            await this.applicantRepository.findByUserId(userId);

        if (!applicant) {
            throw new ApiError(
                404,
                "Applicant profile not found"
            );
        }

        const application =
            await this.applicationRepository.findById(id);

        if (!application) {
            throw new ApiError(
                404,
                "Application not found"
            );
        }

        if (
            application.applicantId.toString() !==
            applicant._id!.toString()
        ) {
            throw new ApiError(
                403,
                "You can only withdraw your own application"
            );
        }

        if (
            application.status === "accepted" ||
            application.status === "rejected"
        ) {
            throw new ApiError(
                400,
                "This application can no longer be withdrawn"
            );
        }

        return this.applicationRepository.updateById(
            id,
            { status: "withdrawn" }
        );
    }

}