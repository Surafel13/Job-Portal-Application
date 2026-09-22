import { Schema, model } from "mongoose";
import type { ISavedJob } from "./savedJob.interface.js";

const savedJobSchema = new Schema<ISavedJob>(
    {
        userId: {
            type: Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },
        jobId: {
            type: Schema.Types.ObjectId,
            ref: "Job",
            required: true,
        },
    },
    {
        timestamps: true,
    }
);

savedJobSchema.index(
    { userId: 1, jobId: 1 },
    { unique: true }
);

export const SavedJob = model<ISavedJob>("SavedJob", savedJobSchema);