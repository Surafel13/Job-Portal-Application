import type { Types } from "mongoose";

export type NotificationType =
    | "application"
    | "job"
    | "interview"
    | "message"
    | "report"
    | "employer"
    | "system";

export type NotificationPriority =
    | "low"
    | "medium"
    | "high";

export interface INotification {
    _id?: Types.ObjectId;

    userId: Types.ObjectId;

    type: NotificationType;

    title: string;

    message: string;

    priority: NotificationPriority;

    isRead: boolean;

    resourceType?: string;

    resourceId?: Types.ObjectId;

    createdAt?: Date;

    updatedAt?: Date;
}