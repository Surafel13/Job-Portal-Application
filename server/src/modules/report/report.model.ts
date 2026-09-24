import { Schema, model } from "mongoose";
import type { IReport } from "./report.interface.js";

const reportSchema = new Schema<IReport>(
    {
        reporterId: {
            type: Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },

        resourceType: {
            type: String,
            enum: [
                "user",
                "employer",
                "job",
                "content",
            ],
            required: true,
        },

        resourceId: {
            type: Schema.Types.ObjectId,
            required: true,
        },

        reason: {
            type: String,
            enum: [
                "spam",
                "fraud",
                "inappropriate_content",
                "misleading_information",
                "harassment",
                "scam",
                "duplicate",
                "other",
            ],
            required: true,
        },

        description: {
            type: String,
            trim: true,
            maxlength: 2000,
        },

        status: {
            type: String,
            enum: [
                "pending",
                "reviewing",
                "resolved",
                "rejected",
            ],
            default: "pending",
            required: true,
        },

        adminId: {
            type: Schema.Types.ObjectId,
            ref: "User",
        },

        adminDecision: {
            type: String,
            trim: true,
            maxlength: 2000,
        },

        reviewedAt: {
            type: Date,
        },
    },
    {
        timestamps: true,
        versionKey: false,
    }
);

reportSchema.index({ reporterId: 1, createdAt: -1 });
reportSchema.index({ resourceType: 1, resourceId: 1 });
reportSchema.index({ status: 1, createdAt: -1 });
reportSchema.index({ adminId: 1, reviewedAt: -1 });

const ReportModel = model<IReport>("Report", reportSchema);

export default ReportModel;