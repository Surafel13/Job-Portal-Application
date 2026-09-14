import { ApiError } from "../../utils/ApiError.js";
import { getPagination } from "../../utils/pagination.js";
import type { ICategory } from "./category.interface.js";
import { CategoryRepository } from "./category.repository.js";

export class CategoryService {
    constructor(
        private readonly categoryRepository: CategoryRepository
    ) {}

    async create(data: ICategory): Promise<ICategory> {
        const existingName =
            await this.categoryRepository.findByName(data.name);

        if (existingName) {
            throw new ApiError(409, "Category name already exists.");
        }

        const existingSlug =
            await this.categoryRepository.findBySlug(data.slug);

        if (existingSlug) {
            throw new ApiError(409, "Category slug already exists.");
        }

        return await this.categoryRepository.create(data);
    }

    async getById(id: string): Promise<ICategory> {
        const category = await this.categoryRepository.findById(id);

        if (!category) {
            throw new ApiError(404, "Category not found.");
        }

        return category;
    }

    async getByName(name: string): Promise<ICategory> {
        const category =
            await this.categoryRepository.findByName(name);

        if (!category) {
            throw new ApiError(404, "Category not found.");
        }

        return category;
    }

    async getBySlug(slug: string): Promise<ICategory> {
        const category =
            await this.categoryRepository.findBySlug(slug);

        if (!category) {
            throw new ApiError(404, "Category not found.");
        }

        return category;
    }

    async getAll(page?: number, limit?: number) {
        const totalItems = await this.categoryRepository.count();

        const pagination = getPagination(
            {
                page,
                limit,
            },
            totalItems
        );

        const categories = await this.categoryRepository.findAll(
            pagination.skip,
            pagination.limit
        );

        return {
            categories,
            pagination,
        };
    }

    async update(
        id: string,
        data: Partial<ICategory>
    ): Promise<ICategory> {
        const category = await this.categoryRepository.findById(id);

        if (!category) {
            throw new ApiError(404, "Category not found.");
        }

        if (data.name && data.name !== category.name) {
            const existingName =
                await this.categoryRepository.findByName(data.name);

            if (existingName) {
                throw new ApiError(409, "Category name already exists.");
            }
        }

        if (data.slug && data.slug !== category.slug) {
            const existingSlug =
                await this.categoryRepository.findBySlug(data.slug);

            if (existingSlug) {
                throw new ApiError(409, "Category slug already exists.");
            }
        }

        const updatedCategory =
            await this.categoryRepository.updateById(id, data);

        if (!updatedCategory) {
            throw new ApiError(404, "Category not found.");
        }

        return updatedCategory;
    }

    async delete(id: string): Promise<ICategory> {
        const category =
            await this.categoryRepository.deleteById(id);

        if (!category) {
            throw new ApiError(404, "Category not found.");
        }

        return category;
    }
}