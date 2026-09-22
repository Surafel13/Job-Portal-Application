import type { Types } from "mongoose";

export type JobStatus =
    | "draft"
    | "pending"
    | "published"
    | "closed"
    | "expired"
    | "rejected";

export type EmploymentType =
    | "full-time"
    | "part-time"
    | "contract"
    | "internship"
    | "freelance";

export type ExperienceLevel =
    | "entry"
    | "junior"
    | "mid"
    | "senior"
    | "lead";

export type EducationLevel =
    | "high-school"
    | "certificate"
    | "diploma"
    | "bachelor"
    | "master"
    | "phd";

export interface ISalaryRange {
    minimum?: number;
    maximum?: number;
    currency?: string;
}

export interface IJob {
    _id?: Types.ObjectId;
    companyId: Types.ObjectId;
    title: string;
    description: string;
    requirements: string[];
    responsibilities: string[];
    location: string;
    employmentType: EmploymentType;
    salary?: ISalaryRange;
    experienceLevel?: ExperienceLevel;
    educationLevel?: EducationLevel;
    skills: Types.ObjectId[];
    categoryId: Types.ObjectId;
    status: JobStatus;
    publishedAt?: Date;
    deadline?: Date;
    viewCount: number;
    createdAt?: Date;
    updatedAt?: Date;
}