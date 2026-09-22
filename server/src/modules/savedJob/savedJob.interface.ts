import type { Types } from "mongoose";

export interface ISavedJob {
    _id?: Types.ObjectId;
    userId: Types.ObjectId;
    jobId: Types.ObjectId;
    createdAt?: Date;
    updatedAt?: Date;
}