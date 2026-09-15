import type { Types } from "mongoose";
import Skill from "./skill.model.js";
import type { ISkill } from "./skill.interface.js";

export class SkillRepository {
    async create(data: ISkill): Promise<ISkill> {
        const skill = await Skill.create(data);
        return skill.toObject();
    }

    async findById(id: string | Types.ObjectId): Promise<ISkill | null> {
        return Skill.findById(id)
            .lean<ISkill>()
            .exec();
    }

    async findByName(name: string): Promise<ISkill | null> {
        return Skill.findOne({ name })
            .lean<ISkill>()
            .exec();
    }

    async findBySlug(slug: string): Promise<ISkill | null> {
        return Skill.findOne({ slug })
            .lean<ISkill>()
            .exec();
    }

    async findAll(skip: number, limit: number): Promise<ISkill[]> {
        return Skill.find()
            .sort({ name: 1 })
            .skip(skip)
            .limit(limit)
            .lean<ISkill[]>()
            .exec();
    }

    async count(): Promise<number> {
        return Skill.countDocuments();
    }

    async updateById(
        id: string,
        data: Partial<ISkill>
    ): Promise<ISkill | null> {
        return Skill.findByIdAndUpdate(
            id,
            { $set: data },
            {
                new: true,
                runValidators: true,
            }
        )
            .lean<ISkill>()
            .exec();
    }

    async deleteById(id: string): Promise<boolean> {
        const result = await Skill.deleteOne({ _id: id }).exec();

        return result.deletedCount === 1;
    }
}

export default SkillRepository;
