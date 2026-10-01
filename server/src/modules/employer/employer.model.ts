import { Schema, model } from "mongoose";
import type { IEmployer } from "./employer.interface.js";

const employerSchema = new Schema<IEmployer>(
    {
        name: {
            type: String,
            required: true,
            unique: true,
            trim: true,
            minlength: 2,
            maxlength: 150,
        },
        website: {
            type: String,
            trim: true,
        },
        industry: {
            type: String,
            trim: true,
            maxlength: 100,
        },
        size: {
            type: String,
            enum: ["1-10", "11-50", "51-200", "201-500", "501-1000", "1001-5000", "5001+"],
        },
        headquarters: {
            type: String,
            trim: true,
            maxlength: 150,
        },
        description: {
            type: String,
            trim: true,
            maxlength: 2000,
        },
        logo: {
            type: String,
            trim: true,
        },
        verificationStatus: {
            type: String,
            enum: ["pending", "verified", "rejected", "suspended"],
            default: "pending",
            required: true,
            index: true,
        },
        subscriptionPlan: {
            type: String,
            trim: true,
            maxlength: 100,
        },
        recruiters: {
            type: [Schema.Types.ObjectId],
            ref: "User",
            required: true,
            default: [],
        },
    },
    {
        timestamps: true,
        versionKey: false,
    }
);

employerSchema.index({ recruiters: 1 });

export const Company = model<IEmployer>("Employer", employerSchema);

export default Company;
