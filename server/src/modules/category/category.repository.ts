import type { Types } from "mongoose";
import { Category } from "./category.model.js";
import type { ICategory } from "./category.interface.js";

export class CategoryRepository {
    async create(data: ICategory): Promise<ICategory> {
        return await Category.create(data);
    }

    async findById(
        id: string | Types.ObjectId
    ): Promise<ICategory | null> {
        return await Category.findById(id).lean<ICategory>();
    }

    async findByName(name: string): Promise<ICategory | null> {
        return await Category.findOne({ name }).lean<ICategory>();
    }

    async findBySlug(slug: string): Promise<ICategory | null> {
        return await Category.findOne({ slug }).lean<ICategory>();
    }

    async findAll(
        filter: Record<string, unknown> = {}
    ): Promise<ICategory[]> {
        return await Category.find(filter)
            .sort({ createdAt: -1 })
            .lean<ICategory[]>();
    }

    async updateById(
        id: string,
        data: Partial<ICategory>
    ): Promise<ICategory | null> {
        return await Category.findByIdAndUpdate(
            id,
            { $set: data },
            {
                new: true,
                runValidators: true,
            }
        ).lean<ICategory>();
    }

    async deleteById(id: string): Promise<ICategory | null> {
        return await Category.findByIdAndDelete(id).lean<ICategory>();
    }
}