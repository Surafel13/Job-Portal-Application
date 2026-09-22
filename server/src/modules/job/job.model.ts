import mongoose, { Schema } from "mongoose";
import type { IJob, ISalaryRange } from "./job.interface.js";

const salarySchema = new Schema<ISalaryRange>(
    {
        minimum: {
            type: Number,
            min: 0,
        },
        maximum: {
            type: Number,
            min: 0,
        },
        currency: {
            type: String,
            trim: true,
            uppercase: true,
            default: "ETB",
        },
    },
    {
        _id: false,
    }
);

const jobSchema = new Schema<IJob>(
    {
        companyId: {
            type: Schema.Types.ObjectId,
            ref: "Company",
            required: true,
            index: true,
        },

        title: {
            type: String,
            required: true,
            trim: true,
            minlength: 2,
            maxlength: 150,
        },

        description: {
            type: String,
            required: true,
            trim: true,
            minlength: 20,
            maxlength: 10000,
        },

        requirements: {
            type: [String],
            required: true,
            default: [],
        },

        responsibilities: {
            type: [String],
            required: true,
            default: [],
        },

        location: {
            type: String,
            required: true,
            trim: true,
            maxlength: 150,
        },

        employmentType: {
            type: String,
            enum: [
                "full-time",
                "part-time",
                "contract",
                "internship",
                "freelance",
            ],
            required: true,
            index: true,
        },

        salary: {
            type: salarySchema,
        },

        experienceLevel: {
            type: String,
            enum: [
                "entry",
                "junior",
                "mid",
                "senior",
                "lead",
            ],
            index: true,
        },

        educationLevel: {
            type: String,
            enum: [
                "high-school",
                "certificate",
                "diploma",
                "bachelor",
                "master",
                "phd",
            ],
            index: true,
        },

        skills: [
            {
                type: Schema.Types.ObjectId,
                ref: "Skill",
            },
        ],

        categoryId: {
            type: Schema.Types.ObjectId,
            ref: "Category",
            required: true,
            index: true,
        },

        status: {
            type: String,
            enum: [
                "draft",
                "pending",
                "published",
                "closed",
                "expired",
                "rejected",
            ],
            default: "draft",
            required: true,
            index: true,
        },

        publishedAt: {
            type: Date,
        },

        deadline: {
            type: Date,
            index: true,
        },

        viewCount: {
            type: Number,
            default: 0,
            min: 0,
        },
    },
    {
        timestamps: true,
        versionKey: false,
    }
);

jobSchema.index({
    status: 1,
    createdAt: -1,
});

jobSchema.index({
    companyId: 1,
    status: 1,
});

jobSchema.index({
    categoryId: 1,
    status: 1,
});

jobSchema.index({
    skills: 1,
    status: 1,
});

jobSchema.index({
    location: 1,
    status: 1,
});

export const JobModel = mongoose.model<IJob>(
    "Job",
    jobSchema
);

export default JobModel;