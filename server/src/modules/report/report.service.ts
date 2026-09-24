import { Types } from "mongoose";
import { ApiError } from "../../utils/ApiError.js";
import reportRepository from "./report.repository.js";
import type {
    IReport,
    ReportReason,
    ReportResourceType,
    ReportStatus,
} from "./report.interface.js";

export class ReportService {
    private validateObjectId(
        id: string,
        field: string
    ): Types.ObjectId {
        if (!Types.ObjectId.isValid(id)) {
            throw new ApiError(400, `Invalid ${field}.`);
        }

        return new Types.ObjectId(id);
    }

    async createReport(data: {
        reporterId: string;
        resourceType: ReportResourceType;
        resourceId: string;
        reason: ReportReason;
        description?: string;
    }): Promise<IReport> {
        const reporterId = this.validateObjectId(
            data.reporterId,
            "reporter ID"
        );

        const resourceId = this.validateObjectId(
            data.resourceId,
            "resource ID"
        );

        const existingReports =
            await reportRepository.findByResource(
                data.resourceType,
                resourceId
            );

        const alreadyReported = existingReports.some(
            (report) =>
                report.reporterId.toString() ===
                    reporterId.toString() &&
                report.status === "pending"
        );

        if (alreadyReported) {
            throw new ApiError(
                409,
                "You have already reported this resource."
            );
        }

        const reportData: IReport = {
            reporterId,
            resourceType: data.resourceType,
            resourceId,
            reason: data.reason,
            ...(data.description !== undefined && {
                description: data.description,
            }),
            status: "pending",
        };

        return reportRepository.create(reportData);
    }

    async getReportById(
        reportId: string
    ): Promise<IReport> {
        const reportObjectId = this.validateObjectId(
            reportId,
            "report ID"
        );

        const report = await reportRepository.findById(
            reportObjectId
        );

        if (!report) {
            throw new ApiError(404, "Report not found.");
        }

        return report;
    }

    async getMyReports(
        reporterId: string
    ): Promise<IReport[]> {
        const reporterObjectId = this.validateObjectId(
            reporterId,
            "reporter ID"
        );

        return reportRepository.findByReporter(
            reporterObjectId
        );
    }

    async getReportsByResource(
        resourceType: ReportResourceType,
        resourceId: string
    ): Promise<IReport[]> {
        const resourceObjectId = this.validateObjectId(
            resourceId,
            "resource ID"
        );

        return reportRepository.findByResource(
            resourceType,
            resourceObjectId
        );
    }

    async getReportsByStatus(
        status: ReportStatus
    ): Promise<IReport[]> {
        return reportRepository.findByStatus(status);
    }

    async getAllReports(): Promise<IReport[]> {
        return reportRepository.findAll();
    }

    async startReview(
        reportId: string,
        adminId: string
    ): Promise<IReport> {
        const reportObjectId = this.validateObjectId(
            reportId,
            "report ID"
        );

        const adminObjectId = this.validateObjectId(
            adminId,
            "admin ID"
        );

        const report = await reportRepository.findById(
            reportObjectId
        );

        if (!report) {
            throw new ApiError(404, "Report not found.");
        }

        if (report.status !== "pending") {
            throw new ApiError(
                400,
                "Only pending reports can be reviewed."
            );
        }

        const updatedReport =
            await reportRepository.updateStatus(
                reportObjectId,
                "reviewing",
                adminObjectId
            );

        if (!updatedReport) {
            throw new ApiError(404, "Report not found.");
        }

        return updatedReport;
    }

    async resolveReport(
        reportId: string,
        adminId: string,
        adminDecision: string
    ): Promise<IReport> {
        const reportObjectId = this.validateObjectId(
            reportId,
            "report ID"
        );

        const adminObjectId = this.validateObjectId(
            adminId,
            "admin ID"
        );

        const decision = adminDecision.trim();

        if (!decision) {
            throw new ApiError(
                400,
                "Admin decision is required."
            );
        }

        const report = await reportRepository.findById(
            reportObjectId
        );

        if (!report) {
            throw new ApiError(404, "Report not found.");
        }

        if (
            report.status !== "pending" &&
            report.status !== "reviewing"
        ) {
            throw new ApiError(
                400,
                "Only pending or reviewing reports can be resolved."
            );
        }

        const updatedReport =
            await reportRepository.updateStatus(
                reportObjectId,
                "resolved",
                adminObjectId,
                decision
            );

        if (!updatedReport) {
            throw new ApiError(404, "Report not found.");
        }

        return updatedReport;
    }

    async rejectReport(
        reportId: string,
        adminId: string,
        adminDecision: string
    ): Promise<IReport> {
        const reportObjectId = this.validateObjectId(
            reportId,
            "report ID"
        );

        const adminObjectId = this.validateObjectId(
            adminId,
            "admin ID"
        );

        const decision = adminDecision.trim();

        if (!decision) {
            throw new ApiError(
                400,
                "Admin decision is required."
            );
        }

        const report = await reportRepository.findById(
            reportObjectId
        );

        if (!report) {
            throw new ApiError(404, "Report not found.");
        }

        if (
            report.status !== "pending" &&
            report.status !== "reviewing"
        ) {
            throw new ApiError(
                400,
                "Only pending or reviewing reports can be rejected."
            );
        }

        const updatedReport =
            await reportRepository.updateStatus(
                reportObjectId,
                "rejected",
                adminObjectId,
                decision
            );

        if (!updatedReport) {
            throw new ApiError(404, "Report not found.");
        }

        return updatedReport;
    }

    async deleteReport(
        reportId: string
    ): Promise<void> {
        const reportObjectId = this.validateObjectId(
            reportId,
            "report ID"
        );

        const deletedReport =
            await reportRepository.deleteById(
                reportObjectId
            );

        if (!deletedReport) {
            throw new ApiError(404, "Report not found.");
        }
    }

    async getReportCountByStatus(
        status: ReportStatus
    ): Promise<number> {
        return reportRepository.countByStatus(status);
    }

    async getResourceReportCount(
        resourceType: ReportResourceType,
        resourceId: string
    ): Promise<number> {
        const resourceObjectId = this.validateObjectId(
            resourceId,
            "resource ID"
        );

        return reportRepository.countByResource(
            resourceType,
            resourceObjectId
        );
    }
}

export const reportService = new ReportService();

export default reportService;