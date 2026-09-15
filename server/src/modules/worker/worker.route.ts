import { Router } from "express";
import authMiddleware from "../../middlewares/auth.middleware.js";
import {
    validateBody,
    validateParams,
} from "../../middlewares/validation.middleware.js";
import asyncHandler from "../../utils/asyncHandler.js";
import {
    createWorker,
    deleteWorker,
    getMyWorkerProfile,
    getWorkerByUserId,
    updateWorker,
} from "./worker.controller.js";
import {
    createWorkerSchema,
    updateWorkerSchema,
    workerUserIdParamSchema,
} from "./worker.validation.js";

const router = Router();

router.use(authMiddleware);

router.post(
    "/",
    validateBody(createWorkerSchema),
    asyncHandler(createWorker)
);

router.get("/me", asyncHandler(getMyWorkerProfile));

router.patch(
    "/me",
    validateBody(updateWorkerSchema),
    asyncHandler(updateWorker)
);

router.delete("/me", asyncHandler(deleteWorker));

router.get(
    "/:userId",
    validateParams(workerUserIdParamSchema),
    asyncHandler(getWorkerByUserId)
);

export default router;
