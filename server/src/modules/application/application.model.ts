import { Schema, model } from "mongoose";
import type { IApplication } from "./application.interface.js";

const applicationSchema = new Schema<IApplication>(
    {
        applicantId: {
            type: Schema.Types.ObjectId,
            ref: "Applicant",
            required: true,
        },
        jobId: {
            type: Schema.Types.ObjectId,
            ref: "Job",
            required: true,
        },
        resumeId: {
            type: Schema.Types.ObjectId,
            ref: "Resume",
            required: true,
        },
        coverLetter: {
            type: String,
            trim: true,
        },
        status: {
            type: String,
            enum: [
                "pending",
                "reviewing",
                "shortlisted",
                "interview",
                "accepted",
                "rejected",
                "withdrawn",
            ],
            default: "pending",
        },
        appliedAt: {
            type: Date,
            default: Date.now,
        },
    },
    {
        timestamps: true,
    }
);

applicationSchema.index(
    { applicantId: 1, jobId: 1 },
    { unique: true }
);

export default model<IApplication>("Application", applicationSchema);