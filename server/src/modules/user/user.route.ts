import { Router } from "express";

import {
    deleteUser,
    getUserByEmail,
    getUserById,
    getUsersByRole,
    updateUser,
    updateUserStatus,
} from "./user.controller.js";

import {
    updateUserSchema,
    updateUserStatusSchema,
    userIdParamSchema,
    userQuerySchema,
} from "./user.validation.js";

import {
    validateBody,
    validateParams,
    validateQuery,
} from "../../middlewares/validation.middleware.js";

import authMiddleware from "../../middlewares/auth.middleware.js";
import asyncHandler from "../../utils/asyncHandler.js";

const router = Router();

router.use(authMiddleware);

router.get(
    "/email",
    asyncHandler(getUserByEmail)
);

router.get(
    "/role",
    validateQuery(userQuerySchema),
    asyncHandler(getUsersByRole)
);

router.get(
    "/:id",
    validateParams(userIdParamSchema),
    asyncHandler(getUserById)
);

router.patch(
    "/:id",
    validateParams(userIdParamSchema),
    validateBody(updateUserSchema),
    asyncHandler(updateUser)
);

router.patch(
    "/status/:id",
    validateParams(userIdParamSchema),
    validateBody(updateUserStatusSchema),
    asyncHandler(updateUserStatus)
);

router.delete(
    "/:id",
    validateParams(userIdParamSchema),
    asyncHandler(deleteUser)
);

export default router;