import { Schema, model } from "mongoose";
import type { IWorker } from "./worker.interface.js";

const workerSkillSchema = new Schema(
    {
        skillId: {
            type: Schema.Types.ObjectId,
            ref: "Skill",
            required: true,
        },
        name: {
            type: String,
            required: true,
            trim: true,
            maxlength: 100,
        },
        level: {
            type: String,
            enum: ["beginner", "intermediate", "advanced", "expert"],
        },
    },
    { _id: false }
);

const educationSchema = new Schema(
    {
        institution: {
            type: String,
            required: true,
            trim: true,
            maxlength: 150,
        },
        degree: {
            type: String,
            required: true,
            trim: true,
            maxlength: 150,
        },
        fieldOfStudy: {
            type: String,
            trim: true,
            maxlength: 150,
        },
        startDate: Date,
        endDate: Date,
        description: {
            type: String,
            trim: true,
            maxlength: 1000,
        },
    },
    { _id: false }
);

const experienceSchema = new Schema(
    {
        company: {
            type: String,
            required: true,
            trim: true,
            maxlength: 150,
        },
        jobTitle: {
            type: String,
            required: true,
            trim: true,
            maxlength: 150,
        },
        location: {
            type: String,
            trim: true,
            maxlength: 150,
        },
        startDate: {
            type: Date,
            required: true,
        },
        endDate: Date,
        isCurrent: {
            type: Boolean,
            default: false,
        },
        description: {
            type: String,
            trim: true,
            maxlength: 2000,
        },
    },
    { _id: false }
);

const workerSchema = new Schema<IWorker>(
    {
        userId: {
            type: Schema.Types.ObjectId,
            ref: "User",
            required: true,
            unique: true,
            index: true,
        },
        professionalSummary: {
            type: String,
            trim: true,
            maxlength: 2000,
        },
        skills: {
            type: [workerSkillSchema],
            default: [],
        },
        education: {
            type: [educationSchema],
            default: [],
        },
        experience: {
            type: [experienceSchema],
            default: [],
        },
        location: {
            type: String,
            trim: true,
            maxlength: 150,
        },
        preferredJobTypes: {
            type: [String],
            enum: ["full-time", "part-time", "contract", "internship", "freelance"],
            default: [],
        },
        preferredLocations: {
            type: [String],
            default: [],
        },
        preferredWorkTypes: {
            type: [String],
            enum: ["onsite", "remote", "hybrid"],
            default: [],
        },
        minimumSalary: {
            type: Number,
            min: 0,
        },
        maximumSalary: {
            type: Number,
            min: 0,
        },
        resumeIds: {
            type: [Schema.Types.ObjectId],
            ref: "Resume",
            default: [],
        },
        profileCompletion: {
            type: Number,
            default: 0,
            min: 0,
            max: 100,
        },
        availableFrom: Date,
        website: {
            type: String,
            trim: true,
        },
        linkedin: {
            type: String,
            trim: true,
        },
        github: {
            type: String,
            trim: true,
        },
    },
    {
        timestamps: true,
        versionKey: false,
    }
);

workerSchema.index({ location: 1 });

export const Worker = model<IWorker>("Worker", workerSchema);

export default Worker;
