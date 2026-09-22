import { Types } from "mongoose";
import Applicant from "./applicant.model.js";
import type { IApplicant } from "./applicant.interface.js";

export class ApplicantRepository {
    async create(data: IApplicant) {
        return Applicant.create(data);
    }

    async findById(id: string) {
        return Applicant.findById(id)
            .populate("userId")
            .populate("resumeId")
            .populate("skills");
    }

    async findByUserId(userId: string) {
        return Applicant.findOne({
            userId: new Types.ObjectId(userId),
        })
            .populate("userId")
            .populate("resumeId")
            .populate("skills");
    }

    async updateById(id: string, data: Partial<IApplicant>) {
        return Applicant.findByIdAndUpdate(
            id,
            data,
            {
                new: true,
                runValidators: true,
            }
        );
    }

    async deleteById(id: string) {
        return Applicant.findByIdAndDelete(id);
    }
}
