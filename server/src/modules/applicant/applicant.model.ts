import { Schema, model } from "mongoose";
import type { IApplicant } from "./applicant.interface.js";

const applicantSchema = new Schema<IApplicant>(
    {
        userId: {
            type: Schema.Types.ObjectId,
            ref: "User",
            required: true,
            unique: true,
        },
        resumeId: {
            type: Schema.Types.ObjectId,
            ref: "Resume",
            required: true,
        },
        skills: [
            {
                type: Schema.Types.ObjectId,
                ref: "Skill",
            },
        ],
        experience: {
            type: Number,
            min: 0,
        },
        education: {
            type: String,
            trim: true,
        },
        bio: {
            type: String,
            trim: true,
        },
        phone: {
            type: String,
            trim: true,
        },
        location: {
            type: String,
            trim: true,
        },
        status: {
            type: String,
            enum: ["active", "inactive", "blocked"],
            default: "active",
        },
    },
    {
        timestamps: true,
    }
);

export default model<IApplicant>("Applicant", applicantSchema);