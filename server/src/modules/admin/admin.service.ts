import { Types } from "mongoose";
import { ApiError } from "../../utils/ApiError.js";
import adminRepository from "./admin.repository.js";
import type {
    AdminAction,
    IAdminAction,
    IAdminDashboard,
} from "./admin.interface.js";

export class AdminService {
    private validateObjectId(
        id: string,
        field: string
    ): Types.ObjectId {
        if (!Types.ObjectId.isValid(id)) {
            throw new ApiError(400, `Invalid ${field}.`);
        }

        return new Types.ObjectId(id);
    }

    async getUserById(userId: string) {
        const userObjectId = this.validateObjectId(
            userId,
            "user ID"
        );

        const user = await adminRepository.findUserById(
            userObjectId
        );

        if (!user) {
            throw new ApiError(404, "User not found.");
        }

        return user;
    }

    async suspendUser(userId: string) {
        const userObjectId = this.validateObjectId(
            userId,
            "user ID"
        );

        const user = await adminRepository.findUserById(
            userObjectId
        );

        if (!user) {
            throw new ApiError(404, "User not found.");
        }

        if (user.status === "suspended") {
            throw new ApiError(
                400,
                "User is already suspended."
            );
        }

        const updatedUser =
            await adminRepository.updateUserStatus(
                userObjectId,
                "suspended"
            );

        if (!updatedUser) {
            throw new ApiError(404, "User not found.");
        }

        return updatedUser;
    }

    async unsuspendUser(userId: string) {
        const userObjectId = this.validateObjectId(
            userId,
            "user ID"
        );

        const user = await adminRepository.findUserById(
            userObjectId
        );

        if (!user) {
            throw new ApiError(404, "User not found.");
        }

        if (user.status !== "suspended") {
            throw new ApiError(
                400,
                "User is not suspended."
            );
        }

        const updatedUser =
            await adminRepository.updateUserStatus(
                userObjectId,
                "active"
            );

        if (!updatedUser) {
            throw new ApiError(404, "User not found.");
        }

        return updatedUser;
    }

    async verifyEmployer(employerId: string) {
        const employerObjectId = this.validateObjectId(
            employerId,
            "employer ID"
        );

        const employer =
            await adminRepository.findEmployerById(
                employerObjectId
            );

        if (!employer) {
            throw new ApiError(404, "Employer not found.");
        }

        if (employer.verificationStatus === "verified") {
            throw new ApiError(
                400,
                "Employer is already verified."
            );
        }

        const updatedEmployer =
            await adminRepository.updateEmployerVerification(
                employerObjectId,
                "verified"
            );

        if (!updatedEmployer) {
            throw new ApiError(404, "Employer not found.");
        }

        return updatedEmployer;
    }

    async rejectEmployer(employerId: string) {
        const employerObjectId = this.validateObjectId(
            employerId,
            "employer ID"
        );

        const employer =
            await adminRepository.findEmployerById(
                employerObjectId
            );

        if (!employer) {
            throw new ApiError(404, "Employer not found.");
        }

        const updatedEmployer =
            await adminRepository.updateEmployerVerification(
                employerObjectId,
                "rejected"
            );

        if (!updatedEmployer) {
            throw new ApiError(404, "Employer not found.");
        }

        return updatedEmployer;
    }

    async suspendEmployer(employerId: string) {
        const employerObjectId = this.validateObjectId(
            employerId,
            "employer ID"
        );

        const employer =
            await adminRepository.findEmployerById(
                employerObjectId
            );

        if (!employer) {
            throw new ApiError(404, "Employer not found.");
        }

        if (employer.verificationStatus === "suspended") {
            throw new ApiError(
                400,
                "Employer is already suspended."
            );
        }

        const updatedEmployer =
            await adminRepository.updateEmployerStatus(
                employerObjectId,
                "suspended"
            );

        if (!updatedEmployer) {
            throw new ApiError(404, "Employer not found.");
        }

        return updatedEmployer;
    }

    async unsuspendEmployer(employerId: string) {
        const employerObjectId = this.validateObjectId(
            employerId,
            "employer ID"
        );

        const employer =
            await adminRepository.findEmployerById(
                employerObjectId
            );

        if (!employer) {
            throw new ApiError(404, "Employer not found.");
        }

        if (employer.verificationStatus !== "suspended") {
            throw new ApiError(
                400,
                "Employer is not suspended."
            );
        }

        const updatedEmployer =
            await adminRepository.updateEmployerStatus(
                employerObjectId,
                "verified"
            );

        if (!updatedEmployer) {
            throw new ApiError(404, "Employer not found.");
        }

        return updatedEmployer;
    }

    async publishJob(jobId: string) {
        const jobObjectId = this.validateObjectId(
            jobId,
            "job ID"
        );

        const job = await adminRepository.findJobById(
            jobObjectId
        );

        if (!job) {
            throw new ApiError(404, "Job not found.");
        }

        if (job.status === "published") {
            throw new ApiError(
                400,
                "Job is already published."
            );
        }

        const updatedJob =
            await adminRepository.updateJobStatus(
                jobObjectId,
                "published"
            );

        if (!updatedJob) {
            throw new ApiError(404, "Job not found.");
        }

        return updatedJob;
    }

    async rejectJob(jobId: string) {
        const jobObjectId = this.validateObjectId(
            jobId,
            "job ID"
        );

        const job = await adminRepository.findJobById(
            jobObjectId
        );

        if (!job) {
            throw new ApiError(404, "Job not found.");
        }

        const updatedJob =
            await adminRepository.updateJobStatus(
                jobObjectId,
                "rejected"
            );

        if (!updatedJob) {
            throw new ApiError(404, "Job not found.");
        }

        return updatedJob;
    }

    async closeJob(jobId: string) {
        const jobObjectId = this.validateObjectId(
            jobId,
            "job ID"
        );

        const job = await adminRepository.findJobById(
            jobObjectId
        );

        if (!job) {
            throw new ApiError(404, "Job not found.");
        }

        if (job.status === "closed") {
            throw new ApiError(
                400,
                "Job is already closed."
            );
        }

        const updatedJob =
            await adminRepository.updateJobStatus(
                jobObjectId,
                "closed"
            );

        if (!updatedJob) {
            throw new ApiError(404, "Job not found.");
        }

        return updatedJob;
    }

    async getDashboard(): Promise<IAdminDashboard> {
        const statistics =
            await adminRepository.getStatistics();

        return {
            statistics,
            generatedAt: new Date(),
        };
    }

    async createAdminAction(
        adminId: string,
        action: AdminAction,
        resourceType: IAdminAction["resourceType"],
        resourceId: string,
        reason?: string,
        metadata?: Record<string, unknown>
    ): Promise<IAdminAction> {
        const adminObjectId = this.validateObjectId(
            adminId,
            "admin ID"
        );

        const resourceObjectId = this.validateObjectId(
            resourceId,
            "resource ID"
        );

        return {
            adminId: adminObjectId,
            action,
            resourceType,
            resourceId: resourceObjectId,
            ...(reason !== undefined && { reason }),
            ...(metadata !== undefined && { metadata }),
            createdAt: new Date(),
        };
    }
}

export const adminService = new AdminService();

export default adminService;