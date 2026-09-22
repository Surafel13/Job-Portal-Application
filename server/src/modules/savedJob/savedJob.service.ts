import { Types } from "mongoose";
import { ApiError } from "../../utils/ApiError.js";
import savedJobRepository from "./savedJob.repository.js";

class SavedJobService {
    async saveJob(userId: string, jobId: string) {
        const userObjectId = new Types.ObjectId(userId);
        const jobObjectId = new Types.ObjectId(jobId);

        const existingSavedJob =
            await savedJobRepository.findByUserAndJob(
                userObjectId,
                jobObjectId
            );

        if (existingSavedJob) {
            throw new ApiError(409, "Job is already saved.");
        }

        return savedJobRepository.create(
            userObjectId,
            jobObjectId
        );
    }

    async getSavedJobById(id: string) {
        const savedJob = await savedJobRepository.findById(id);

        if (!savedJob) {
            throw new ApiError(404, "Saved job not found.");
        }

        return savedJob;
    }

    async getSavedJobsByUser(userId: string) {
        const userObjectId = new Types.ObjectId(userId);

        return savedJobRepository.findByUser(userObjectId);
    }

    async removeSavedJob(userId: string, jobId: string) {
        const userObjectId = new Types.ObjectId(userId);
        const jobObjectId = new Types.ObjectId(jobId);

        const savedJob =
            await savedJobRepository.deleteByUserAndJob(
                userObjectId,
                jobObjectId
            );

        if (!savedJob) {
            throw new ApiError(404, "Saved job not found.");
        }

        return savedJob;
    }

    async deleteSavedJobById(id: string) {
        const savedJob = await savedJobRepository.deleteById(id);

        if (!savedJob) {
            throw new ApiError(404, "Saved job not found.");
        }

        return savedJob;
    }
}

export default new SavedJobService();