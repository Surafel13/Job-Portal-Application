import { Schema, model } from "mongoose";
import type { IEmbedding } from "./embedding.interface.js";

const embeddingSchema = new Schema<IEmbedding>(
    {
        resourceType: {
            type: String,
            enum: ["job"],
            required: true,
        },
        resourceId: {
            type: Schema.Types.ObjectId,
            required: true,
        },
        contentHash: {
            type: String,
            required: true,
        },
        modelVersion: {
            type: String,
            required: true,
        },
        values: {
            type: [Number],
            required: true,
            validate: {
                validator: (values: number[]) =>
                    values.length > 0 && values.every(Number.isFinite),
                message: "Embedding values must be a non-empty numeric vector.",
            },
        },
    },
    {
        timestamps: true,
        versionKey: false,
    },
);

embeddingSchema.index(
    { resourceType: 1, resourceId: 1 },
    { unique: true },
);
embeddingSchema.index({ resourceType: 1, updatedAt: -1 });

const EmbeddingModel = model<IEmbedding>("Embedding", embeddingSchema);

export default EmbeddingModel;
