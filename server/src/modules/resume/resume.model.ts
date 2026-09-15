import { Schema, model } from "mongoose";
import type { IResume } from "./resume.interface.js";

const resumeSchema = new Schema<IResume>(
    {
        userId: {
            type: Schema.Types.ObjectId,
            ref: "User",
            required: true,
            index: true,
        },
        workerId: {
            type: Schema.Types.ObjectId,
            ref: "Worker",
            required: true,
            index: true,
        },
        originalName: {
            type: String,
            required: true,
            trim: true,
            maxlength: 255,
        },
        fileName: {
            type: String,
            required: true,
            trim: true,
            unique: true,
        },
        filePath: {
            type: String,
            required: true,
            trim: true,
        },
        cloudinaryUrl: {
            type: String,
            trim: true,
        },
        cloudinaryPublicId: {
            type: String,
            trim: true,
            unique: true,
            sparse: true,
        },
        mimeType: {
            type: String,
            required: true,
            enum: [
                "application/pdf",
                "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
            ],
        },
        size: {
            type: Number,
            required: true,
            min: 1,
        },
    },
    {
        timestamps: true,
        versionKey: false,
    }
);

resumeSchema.index({ userId: 1, createdAt: -1 });

export const Resume = model<IResume>("Resume", resumeSchema);

export default Resume;
