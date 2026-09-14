import type { Types } from "mongoose";

export type CompanyVerificationStatus =
    | "pending"
    | "verified"
    | "rejected"
    | "suspended";

export type CompanySize =
    | "1-10"
    | "11-50"
    | "51-200"
    | "201-500"
    | "501-1000"
    | "1001-5000"
    | "5001+";

export interface ICompany {
    _id?: Types.ObjectId;
    name: string;
    website?: string;
    industry?: string;
    size?: CompanySize;
    headquarters?: string;
    description?: string;
    logo?: string;
    verificationStatus: CompanyVerificationStatus;
    subscriptionPlan?: string;
    recruiters: Types.ObjectId[];
    createdAt?: Date;
    updatedAt?: Date;
}