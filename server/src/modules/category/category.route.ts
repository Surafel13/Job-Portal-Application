import { Router } from "express";
import { categoryController } from "./category.controller.js";
import {
    categoryIdParamSchema,
    createCategorySchema,
    updateCategorySchema,
} from "./category.validation.js";
import {
    validateBody,
    validateParams,
} from "../../middlewares/validation.middleware.js";

const router = Router();

router.post(
    "/",
    validateBody(createCategorySchema),
    categoryController.create
);

router.get(
    "/",
    categoryController.getAll
);

router.get(
    "/name",
    categoryController.getByName
);

router.get(
    "/slug/:slug",
    categoryController.getBySlug
);

router.get(
    "/:id",
    validateParams(categoryIdParamSchema),
    categoryController.getById
);

router.patch(
    "/:id",
    validateParams(categoryIdParamSchema),
    validateBody(updateCategorySchema),
    categoryController.update
);

router.delete(
    "/:id",
    validateParams(categoryIdParamSchema),
    categoryController.delete
);

export default router;