import type { Types } from "mongoose";

export type ApplicantStatus =
    | "active"
    | "inactive"
    | "blocked";

export interface IApplicant {
    _id?: Types.ObjectId;
    userId: Types.ObjectId;
    resumeId?: Types.ObjectId;
    skills: Types.ObjectId[];
    experience?: number;
    education?: string;
    bio?: string;
    phone?: string;
    location?: string;
    status: ApplicantStatus;
    createdAt?: Date;
    updatedAt?: Date;
}