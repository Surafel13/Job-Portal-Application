import type { Types } from "mongoose";

export interface ISkill {
    _id?: Types.ObjectId;
    name: string;
    slug: string;
    description?: string;
    isActive: boolean;
    createdAt?: Date;
    updatedAt?: Date;
}
