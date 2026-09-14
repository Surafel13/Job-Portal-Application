import mongoose, { Schema } from "mongoose";
import type { IUser } from "./user.interface.js";

const userSchema = new Schema<IUser>(
    {
        fullName: {
            type: String,
            required: true,
            trim: true,
            minlength: 2,
            maxlength: 100,
        },

        email: {
            type: String,
            required: true,
            unique: true,
            lowercase: true,
            trim: true,
            index: true,
        },

        password: {
            type: String,
            required: true,
            minlength: 8,
            select: false,
        },

        phone: {
            type: String,
            trim: true,
            maxlength: 20,
        },

        profileImage: {
            type: String,
            trim: true,
        },

        bio: {
            type: String,
            trim: true,
            maxlength: 1000,
        },

        location: {
            type: String,
            trim: true,
            maxlength: 150,
        },

        role: {
            type: String,
            enum: ["worker", "employer", "admin", "superAdmin"],
            required: true,
            index: true,
        },

        status: {
            type: String,
            enum: ["active", "suspended", "deactivated"],
            default: "active",
            required: true,
            index: true,
        },

        lastLogin: {
            type: Date,
        },
    },
    {
        timestamps: true,
        versionKey: false,
    }
);

userSchema.index({ status: 1, role: 1 });
userSchema.index({ createdAt: -1 });

export const UserModel = mongoose.model<IUser>("User", userSchema);

export default UserModel;