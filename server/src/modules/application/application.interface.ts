import type { Types } from "mongoose";

export type ApplicationStatus =
    | "pending"
    | "reviewing"
    | "shortlisted"
    | "interview"
    | "accepted"
    | "rejected"
    | "withdrawn";

export interface IApplication {
    _id?: Types.ObjectId;
    applicantId: Types.ObjectId;
    jobId: Types.ObjectId;
    coverLetter?: string;
    resumeId?: Types.ObjectId;
    status: ApplicationStatus;
    appliedAt?: Date;
    createdAt?: Date;
    updatedAt?: Date;
}