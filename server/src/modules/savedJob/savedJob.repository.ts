import type { Types } from "mongoose";
import { SavedJob } from "./savedJob.model.js";

class SavedJobRepository {
    async create(userId: Types.ObjectId, jobId: Types.ObjectId) {
        return SavedJob.create({
            userId,
            jobId,
        });
    }

    async findById(id: string) {
        return SavedJob.findById(id);
    }

    async findByUserAndJob(
        userId: Types.ObjectId,
        jobId: Types.ObjectId
    ) {
        return SavedJob.findOne({
            userId,
            jobId,
        });
    }

    async findByUser(userId: Types.ObjectId) {
        return SavedJob.find({
            userId,
        }).populate("jobId");
    }

    async deleteByUserAndJob(
        userId: Types.ObjectId,
        jobId: Types.ObjectId
    ) {
        return SavedJob.findOneAndDelete({
            userId,
            jobId,
        });
    }

    async deleteById(id: string) {
        return SavedJob.findByIdAndDelete(id);
    }
}

export default new SavedJobRepository();