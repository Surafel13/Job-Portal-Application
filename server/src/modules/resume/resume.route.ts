import { Router } from "express";
import authMiddleware from "../../middlewares/auth.middleware.js";
import { authorizeRoles } from "../../middlewares/role.middleware.js";
import { validateBody, validateParams } from "../../middlewares/validation.middleware.js";
import resumeUpload from "../../middlewares/upload.middleware.js";
import asyncHandler from "../../utils/asyncHandler.js";
import {
    deleteResume,
    getMyResumeById,
    getMyResumes,
    uploadResume,
} from "./resume.controller.js";
import {
    createResumeSchema,
    resumeIdParamSchema,
} from "./resume.validation.js";

const router = Router();

router.use(authMiddleware);
router.use(authorizeRoles("worker"));

router.post(
    "/",
    resumeUpload.single("resume"),
    validateBody(createResumeSchema),
    asyncHandler(uploadResume)
);

router.get("/", asyncHandler(getMyResumes));

router.get(
    "/:id",
    validateParams(resumeIdParamSchema),
    asyncHandler(getMyResumeById)
);

router.delete(
    "/:id",
    validateParams(resumeIdParamSchema),
    asyncHandler(deleteResume)
);

export default router;
