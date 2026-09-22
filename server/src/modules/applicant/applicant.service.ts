import { Types } from "mongoose";
import { ApplicantRepository } from "./applicant.repository.js";
import { ResumeRepository } from "../resume/resume.repository.js";
import UserRepository from "../user/user.repository.js";
import { ApiError } from "../../utils/ApiError.js";
import type { IApplicant } from "./applicant.interface.js";

export class ApplicantService {
    private applicantRepository = new ApplicantRepository();
    private userRepository = new UserRepository();
    private resumeRepository = new ResumeRepository();

    async createApplicant(
        userId: Types.ObjectId,
        data: Omit<IApplicant, "userId">
    ) {
        const user = await this.userRepository.findById(userId);

        if (!user) {
            throw new ApiError(404, "User not found");
        }

        if (user.role !== "worker") {
            throw new ApiError(
                403,
                "Only workers can create an applicant profile"
            );
        }

        const existingApplicant =
            await this.applicantRepository.findByUserId(userId.toString());

        if (existingApplicant) {
            throw new ApiError(
                409,
                "Applicant profile already exists"
            );
        }

        if (!data.resumeId) {
            throw new ApiError(
                400,
                "Resume is required"
            );
        }

        const resume = await this.resumeRepository.findById(
            data.resumeId.toString()
        );

        if (!resume) {
            throw new ApiError(404, "Resume not found");
        }

        if (resume.userId.toString() !== userId.toString()) {
            throw new ApiError(
                403,
                "You can only use your own resume"
            );
        }

        return await this.applicantRepository.create({
            ...data,
            userId,
        });
    }

    async getApplicantById(id: string) {
        const applicant =
            await this.applicantRepository.findById(id);

        if (!applicant) {
            throw new ApiError(
                404,
                "Applicant profile not found"
            );
        }

        return applicant;
    }

    async getApplicantByUserId(userId: string) {
        const applicant =
            await this.applicantRepository.findByUserId(userId);

        if (!applicant) {
            throw new ApiError(
                404,
                "Applicant profile not found"
            );
        }

        return applicant;
    }

    async updateApplicant(
        userId: string,
        data: Partial<Omit<IApplicant, "userId">>
    ) {
        const applicant =
            await this.applicantRepository.findByUserId(userId);

        if (!applicant) {
            throw new ApiError(
                404,
                "Applicant profile not found"
            );
        }

        if (applicant.status === "blocked") {
            throw new ApiError(
                403,
                "Blocked applicants cannot update their profile"
            );
        }

        if (data.resumeId) {
            const resume = await this.resumeRepository.findById(
                data.resumeId.toString()
            );

            if (!resume) {
                throw new ApiError(404, "Resume not found");
            }

            if (resume.userId.toString() !== userId) {
                throw new ApiError(
                    403,
                    "You can only use your own resume"
                );
            }
        }

        return await this.applicantRepository.updateById(
            applicant._id!.toString(),
            data
        );
    }

    async updateApplicantStatus(
        id: string,
        status: IApplicant["status"]
    ) {
        const applicant =
            await this.applicantRepository.findById(id);

        if (!applicant) {
            throw new ApiError(
                404,
                "Applicant profile not found"
            );
        }

        return this.applicantRepository.updateById(id, {
            status,
        });
    }

    async deleteApplicant(userId: string) {
        const applicant =
            await this.applicantRepository.findByUserId(userId);

        if (!applicant) {
            throw new ApiError(
                404,
                "Applicant profile not found"
            );
        }

        return await this.applicantRepository.deleteById(
            applicant._id!.toString()
        );
    }
}
