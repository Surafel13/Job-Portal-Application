import { Types } from "mongoose";
import Application from "./application.model.js";
import type { IApplication } from "./application.interface.js";

export class ApplicationRepository {
    async create(data: IApplication) {
        return Application.create(data);
    }

    async findById(id: string) {
        return Application.findById(id)
            .populate("applicantId")
            .populate("jobId")
            .populate("resumeId");
    }

    async findRawById(id: string) {
        return Application.findById(id);
    }

    async findByApplicantAndJob(
        applicantId: string,
        jobId: string
    ) {
        return Application.findOne({
            applicantId: new Types.ObjectId(applicantId),
            jobId: new Types.ObjectId(jobId),
        });
    }

    async countByResumeId(resumeId: string): Promise<number> {
        return Application.countDocuments({
            resumeId: new Types.ObjectId(resumeId),
        });
    }

    async findByApplicantId(applicantId: string) {
        return Application.find({
            applicantId: new Types.ObjectId(applicantId),
        })
            .populate("jobId")
            .populate("resumeId")
            .sort({ createdAt: -1 });
    }

    async findByJobId(jobId: string) {
        return Application.find({
            jobId: new Types.ObjectId(jobId),
        })
            .populate({
                path: "applicantId",
                populate: {
                    path: "userId",
                    select: "fullName email phone profileImage bio location role status",
                },
            })
            .populate("resumeId")
            .sort({ createdAt: -1 });
    }

    async updateById(
        id: string,
        data: Partial<IApplication>
    ) {
        return Application.findByIdAndUpdate(
            id,
            data,
            {
                new: true,
                runValidators: true,
            }
        );
    }

    async deleteById(id: string) {
        return Application.findByIdAndDelete(id);
    }
}
