import type { Types } from "mongoose";

export type AdminAction =
    | "verify_employer"
    | "reject_employer"
    | "suspend_employer"
    | "unsuspend_employer"
    | "suspend_user"
    | "unsuspend_user"
    | "publish_job"
    | "reject_job"
    | "close_job"
    | "review_report"
    | "review_moderation"
    | "update_user"
    | "delete_user";

export type AdminResourceType =
    | "user"
    | "employer"
    | "job"
    | "report"
    | "moderation";

export interface IAdminAction {
    _id?: Types.ObjectId;
    adminId: Types.ObjectId;
    action: AdminAction;
    resourceType: AdminResourceType;
    resourceId: Types.ObjectId;
    reason?: string;
    metadata?: Record<string, unknown>;
    createdAt?: Date;
}

export interface IPlatformStatistics {
    totalUsers: number;
    totalWorkers: number;
    totalEmployers: number;
    totalAdmins: number;
    totalEmployersCount: number;
    verifiedEmployers: number;
    pendingEmployers: number;
    suspendedEmployers: number;
    totalJobs: number;
    publishedJobs: number;
    pendingJobs: number;
    closedJobs: number;
    totalApplications: number;
    totalReports: number;
}

export interface IAdminDashboard {
    statistics: IPlatformStatistics;
    generatedAt: Date;
}