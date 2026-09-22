import type { Types } from "mongoose";
import JobModel from "./job.model.js";
import type { IJob, JobStatus } from "./job.interface.js";

export class JobRepository {
    async create(data: IJob): Promise<IJob> {
        const job = await JobModel.create(data);
        return job.toObject();
    }

    async findById(jobId: string): Promise<IJob | null> {
        return JobModel.findById(jobId)
            .lean<IJob>()
            .exec();
    }

    async findByCompany(
        companyId: Types.ObjectId
    ): Promise<IJob[]> {
        return JobModel.find({ companyId })
            .sort({ createdAt: -1 })
            .lean<IJob[]>()
            .exec();
    }

    async findByCategory(
        categoryId: Types.ObjectId
    ): Promise<IJob[]> {
        return JobModel.find({ categoryId })
            .sort({ createdAt: -1 })
            .lean<IJob[]>()
            .exec();
    }

    async findByStatus(
        status: JobStatus
    ): Promise<IJob[]> {
        return JobModel.find({ status })
            .sort({ createdAt: -1 })
            .lean<IJob[]>()
            .exec();
    }

    async updateById(
        jobId: string,
        data: Partial<IJob>
    ): Promise<IJob | null> {
        return JobModel.findByIdAndUpdate(
            jobId,
            { $set: data },
            {
                new: true,
                runValidators: true,
            }
        )
            .lean<IJob>()
            .exec();
    }

    async deleteById(
        jobId: string
    ): Promise<boolean> {
        const result = await JobModel.deleteOne({
            _id: jobId,
        }).exec();

        return result.deletedCount === 1;
    }

    async existsById(
        jobId: string
    ): Promise<boolean> {
        const job = await JobModel.exists({
            _id: jobId,
        });

        return job !== null;
    }

    async incrementViewCount(
        jobId: string
    ): Promise<IJob | null> {
        return JobModel.findByIdAndUpdate(
            jobId,
            { $inc: { viewCount: 1 } },
            { new: true }
        )
            .lean<IJob>()
            .exec();
    }
}

export const jobRepository = new JobRepository();

export default jobRepository;