import type { Types } from "mongoose";

export type EmbeddingResourceType = "job";

export interface IEmbedding {
    _id?: Types.ObjectId;
    resourceType: EmbeddingResourceType;
    resourceId: Types.ObjectId;
    contentHash: string;
    modelVersion: string;
    values: number[];
    createdAt?: Date;
    updatedAt?: Date;
}