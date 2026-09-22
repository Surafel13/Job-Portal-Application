import type { Types } from "mongoose";

export type EmployerVerificationStatus =

    | "pending"

    | "verified"

    | "rejected"

    | "suspended";

export type EmployerSize =

    | "1-10"

    | "11-50"

    | "51-200"

    | "201-500"

    | "501-1000"

    | "1001-5000"

    | "5001+";

export interface IEmployer {

    _id?: Types.ObjectId;

    name: string;

    website?: string;

    industry?: string;

    size?: EmployerSize;

    headquarters?: string;

    description?: string;

    logo?: string;

    verificationStatus: EmployerVerificationStatus;

    subscriptionPlan?: string;

    recruiters: Types.ObjectId[];

    createdAt?: Date;

    updatedAt?: Date;

}