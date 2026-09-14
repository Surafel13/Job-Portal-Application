import type { Types } from "mongoose";

export type EmploymentPreference =
    | "full-time"
    | "part-time"
    | "contract"
    | "internship"
    | "freelance";

export type WorkPreference =
    | "onsite"
    | "remote"
    | "hybrid";

export interface IWorkerSkill {
    skillId: Types.ObjectId;
    name: string;
    level?: "beginner" | "intermediate" | "advanced" | "expert";
}

export interface IEducation {
    institution: string;
    degree: string;
    fieldOfStudy?: string;
    startDate?: Date;
    endDate?: Date;
    description?: string;
}

export interface IExperience {
    company: string;
    jobTitle: string;
    location?: string;
    startDate: Date;
    endDate?: Date;
    isCurrent: boolean;
    description?: string;
}

export interface IWorker {
    _id?: Types.ObjectId;
    userId: Types.ObjectId;
    
    professionalSummary?: string;
    skills: IWorkerSkill[];
    education: IEducation[];
    experience: IExperience[];
    location?: string;
    preferredJobTypes: EmploymentPreference[];
    preferredLocations: string[];
    preferredWorkTypes: WorkPreference[];
    minimumSalary?: number;
    maximumSalary?: number;
    resumeIds: Types.ObjectId[];
    profileCompletion: number;
    availableFrom?: Date;

    website?: string;

    linkedin?: string;

    github?: string;

    createdAt?: Date;
    updatedAt?: Date;
}