import type { Request, Response } from "express";
import asyncHandler from "../../utils/asyncHandler.js";
import sendResponse from "../../utils/sendResponse.js";
import { CategoryRepository } from "./category.repository.js";
import { CategoryService } from "./category.service.js";

const categoryRepository = new CategoryRepository();
const categoryService = new CategoryService(categoryRepository);

export class CategoryController {
    create = asyncHandler(
        async (req: Request, res: Response): Promise<void> => {
            const category = await categoryService.create(req.body);

            sendResponse(
                res,
                201,
                "Category created successfully.",
                category
            );
        }
    );

    getAll = asyncHandler(
        async (req: Request, res: Response): Promise<void> => {
            const page = req.query.page as number | undefined;
            const limit = req.query.limit as number | undefined;

            const result = await categoryService.getAll(
                page,
                limit
            );

            sendResponse(
                res,
                200,
                "Categories retrieved successfully.",
                result.categories,
                {
                    page: result.pagination.page,
                    limit: result.pagination.limit,
                    skip: result.pagination.skip,
                    totalPages: result.pagination.totalPages,
                    totalItems: result.pagination.totalItems,
                    hasNextPage: result.pagination.hasNextPage,
                    hasPreviousPage: result.pagination.hasPreviousPage,
                }
            );
        }
    );


    getById = asyncHandler(
        async (req: Request, res: Response): Promise<void> => {
            const id = req.params.id as string;

            const category = await categoryService.getById(id);

            sendResponse(
                res,
                200,
                "Category retrieved successfully.",
                category
            );
        }
    );

    getByName = asyncHandler(
        async (req: Request, res: Response): Promise<void> => {
            const name = req.query.name as string;

            const category = await categoryService.getByName(name);

            sendResponse(
                res,
                200,
                "Category retrieved successfully.",
                category
            );
        }
    );

    getBySlug = asyncHandler(
        async (req: Request, res: Response): Promise<void> => {
            const slug = req.params.slug as string;

            const category = await categoryService.getBySlug(slug);

            sendResponse(
                res,
                200,
                "Category retrieved successfully.",
                category
            );
        }
    );

    update = asyncHandler(
        async (req: Request, res: Response): Promise<void> => {
            const id = req.params.id as string;

            const category = await categoryService.update(
                id,
                req.body
            );

            sendResponse(
                res,
                200,
                "Category updated successfully.",
                category
            );
        }
    );

    delete = asyncHandler(
        async (req: Request, res: Response): Promise<void> => {
            const id = req.params.id as string;

            await categoryService.delete(id);

            sendResponse(
                res,
                200,
                "Category deleted successfully."
            );
        }
    );
}

export const categoryController = new CategoryController();