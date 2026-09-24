import type { Types } from "mongoose";
import ReportModel from "./report.model.js";
import type {
    IReport,
    ReportStatus,
} from "./report.interface.js";

export class ReportRepository {
    async create(data: IReport): Promise<IReport> {
        const report = await ReportModel.create(data);

        return report.toObject();
    }

    async findById(
        reportId: Types.ObjectId
    ): Promise<IReport | null> {
        return ReportModel.findById(reportId)
            .lean()
            .exec();
    }

    async findByReporter(
        reporterId: Types.ObjectId
    ): Promise<IReport[]> {
        return ReportModel.find({ reporterId })
            .sort({ createdAt: -1 })
            .lean()
            .exec();
    }

    async findByResource(
        resourceType: IReport["resourceType"],
        resourceId: Types.ObjectId
    ): Promise<IReport[]> {
        return ReportModel.find({
            resourceType,
            resourceId,
        })
            .sort({ createdAt: -1 })
            .lean()
            .exec();
    }

    async findByStatus(
        status: ReportStatus
    ): Promise<IReport[]> {
        return ReportModel.find({ status })
            .sort({ createdAt: -1 })
            .lean()
            .exec();
    }

    async findAll(): Promise<IReport[]> {
        return ReportModel.find()
            .sort({ createdAt: -1 })
            .lean()
            .exec();
    }

    async updateStatus(
        reportId: Types.ObjectId,
        status: ReportStatus,
        adminId?: Types.ObjectId,
        adminDecision?: string
    ): Promise<IReport | null> {
        return ReportModel.findByIdAndUpdate(
            reportId,
            {
                $set: {
                    status,
                    ...(adminId !== undefined && {
                        adminId,
                    }),
                    ...(adminDecision !== undefined && {
                        adminDecision,
                    }),
                    ...(status === "resolved" ||
                    status === "rejected"
                        ? { reviewedAt: new Date() }
                        : {}),
                },
            },
            {
                new: true,
                runValidators: true,
            }
        )
            .lean()
            .exec();
    }

    async deleteById(
        reportId: Types.ObjectId
    ): Promise<IReport | null> {
        return ReportModel.findByIdAndDelete(reportId)
            .lean()
            .exec();
    }

    async countByStatus(
        status: ReportStatus
    ): Promise<number> {
        return ReportModel.countDocuments({ status });
    }

    async countByResource(
        resourceType: IReport["resourceType"],
        resourceId: Types.ObjectId
    ): Promise<number> {
        return ReportModel.countDocuments({
            resourceType,
            resourceId,
        });
    }
}

export const reportRepository = new ReportRepository();

export default reportRepository;