import type { Types } from "mongoose";

export interface IResume {
    _id?: Types.ObjectId;
    userId: Types.ObjectId;
    workerId: Types.ObjectId;
    originalName: string;
    fileName: string;
    filePath: string;
    cloudinaryUrl?: string;
    cloudinaryPublicId?: string;
    mimeType: "application/pdf" | "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
    size: number;
    createdAt?: Date;
    updatedAt?: Date;
}
