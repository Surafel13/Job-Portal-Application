import type { Types } from "mongoose";

export type UserRole = "worker" | "employer" | "admin" | "superAdmin";

export type UserStatus = "active" | "suspended" | "deactivated";

export interface IUser {
    _id?: Types.ObjectId;

    fullName: string;

    email: string;

    password: string;

    phone?: string;

    profileImage?: string;

    bio?: string;

    location?: string;

    role: UserRole;

    status: UserStatus;

    refreshToken?: string | null;

    lastLogin?: Date;

    createdAt?: Date;

    updatedAt?: Date;

    resetPasswordOtp?: string;

    resetPasswordOtpExpiresAt?: Date;

    resetPasswordOtpAttempts?: number;

    resetPasswordToken?: string;

    resetPasswordTokenExpiresAt?: Date;
}