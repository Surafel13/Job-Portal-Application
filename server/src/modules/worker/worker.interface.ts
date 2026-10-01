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

    categoryIds: Types.ObjectId[];

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


// act as a senior backend engineer

// currently my job portal work as following



// import type { Types } from "mongoose";



// export type UserRole = "worker" | "employer" | "admin" | "superAdmin";



// export type UserStatus = "active" | "suspended" | "deactivated";



// export interface IUser {

//     _id?: Types.ObjectId;



//     fullName: string;



//     email: string;



//     password: string;



//     phone?: string;



//     profileImage?: string;



//     bio?: string;



//     location?: string;



//     role: UserRole;



//     status: UserStatus;



//     refreshToken?: string | null;



//     lastLogin?: Date;



//     createdAt?: Date;



//     updatedAt?: Date;



//     resetPasswordOtp?: string;



//     resetPasswordOtpExpiresAt?: Date;



//     resetPasswordOtpAttempts?: number;



//     resetPasswordToken?: string;



//     resetPasswordTokenExpiresAt?: Date;

// }



// this is users interface file. when a users registers with worker role, they will also creating a worker profile with out data and the worker interface is below



// import type { Types } from "mongoose"; 

 

// export type EmploymentPreference = 

//     | "full-time" 

//     | "part-time" 

//     | "contract" 

//     | "internship" 

//     | "freelance"; 

 

// export type WorkPreference = 

//     | "onsite" 

//     | "remote" 

//     | "hybrid"; 

 

// export interface IWorkerSkill { 

//     skillId: Types.ObjectId; 

//     name: string; 

//     level?: "beginner" | "intermediate" | "advanced" | "expert"; 

// } 

 

// export interface IEducation { 

//     institution: string; 

//     degree: string; 

//     fieldOfStudy?: string; 

//     startDate?: Date; 

//     endDate?: Date; 

//     description?: string; 

// } 

 

// export interface IExperience { 

//     company: string; 

//     jobTitle: string; 

//     location?: string; 

//     startDate: Date; 

//     endDate?: Date; 

//     isCurrent: boolean; 

//     description?: string; 

// } 

 

// export interface IWorker { 

//     _id?: Types.ObjectId; 

//     userId: Types.ObjectId; 

 

//     professionalSummary?: string; 

 

//     skills: IWorkerSkill[]; 

 

//     categoryIds: Types.ObjectId[]; 

 

//     education: IEducation[]; 

 

//     experience: IExperience[]; 

 

//     location?: string; 

 

//     preferredJobTypes: EmploymentPreference[]; 

 

//     preferredLocations: string[]; 

 

//     preferredWorkTypes: WorkPreference[]; 

 

//     minimumSalary?: number; 

 

//     maximumSalary?: number; 

 

//     resumeIds: Types.ObjectId[]; 

 

//     profileCompletion: number; 

 

//     availableFrom?: Date; 

 

//     website?: string; 

 

//     linkedin?: string; 

 

//     github?: string; 

 

//     createdAt?: Date; 

//     updatedAt?: Date; 

// }

// I allowed users or workers to update their worker profile, now I want you to generate a seed file for workers



// first 