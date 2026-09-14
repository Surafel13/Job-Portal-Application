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
        async (_req: Request, res: Response): Promise<void> => {
            const categories = await categoryService.getAll();

            sendResponse(
                res,
                200,
                "Categories retrieved successfully.",
                categories
            );
        }
    );

    getById = asyncHandler(
        async (req: Request, res: Response): Promise<void> => {
            const category = await categoryService.getById(
                req.params.id as string
            );

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
            const category = await categoryService.getByName(
                req.query.name as string
            );

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
            const category = await categoryService.getBySlug(
                req.params.slug as string
            );

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
            const category = await categoryService.update(
                req.params.id as string,
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
            await categoryService.delete(req.params.id as string);

            sendResponse(
                res,
                200,
                "Category deleted successfully."
            );
        }
    );
}

export const categoryController = new CategoryController();