import type { Types } from "mongoose";

export type ReportResourceType =
    | "user"
    | "employer"
    | "job"
    | "content";

export type ReportReason =
    | "spam"
    | "fraud"
    | "inappropriate_content"
    | "misleading_information"
    | "harassment"
    | "scam"
    | "duplicate"
    | "other";

export type ReportStatus =
    | "pending"
    | "reviewing"
    | "resolved"
    | "rejected";

export interface IReport {
    _id?: Types.ObjectId;

    reporterId: Types.ObjectId;

    resourceType: ReportResourceType;

    resourceId: Types.ObjectId;

    reason: ReportReason;

    description?: string;

    status: ReportStatus;

    adminId?: Types.ObjectId;

    adminDecision?: string;

    reviewedAt?: Date;

    createdAt?: Date;

    updatedAt?: Date;
}