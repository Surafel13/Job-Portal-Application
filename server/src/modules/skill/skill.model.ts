import { Schema, model } from "mongoose";
import type { ISkill } from "./skill.interface.js";

const skillSchema = new Schema<ISkill>(
    {
        name: {
            type: String,
            required: true,
            unique: true,
            trim: true,
            minlength: 2,
            maxlength: 100,
        },
        slug: {
            type: String,
            required: true,
            unique: true,
            lowercase: true,
            trim: true,
            maxlength: 120,
        },
        description: {
            type: String,
            trim: true,
            maxlength: 500,
        },
        isActive: {
            type: Boolean,
            default: true,
        },
    },
    {
        timestamps: true,
        versionKey: false,
    }
);

export const Skill = model<ISkill>("Skill", skillSchema);

export default Skill;
