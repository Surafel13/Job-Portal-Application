import { Router } from "express";
import authMiddleware from "../../../middlewares/auth.middleware.js";
import { authorizeRoles } from "../../../middlewares/role.middleware.js";
import { aiGenerationRateLimitMiddleware } from "../../../middlewares/rateLimit.middleware.js";
import { validateBody } from "../../../middlewares/validation.middleware.js";
import jobDescriptionController from "./jobDescription.controller.js";
import { generateJobDescriptionSchema } from "./jobDescription.validation.js";

const router: ReturnType<typeof Router> = Router();

router.post(
  "/generate",
  authMiddleware,
  authorizeRoles("employer"),
  aiGenerationRateLimitMiddleware,
  validateBody(generateJobDescriptionSchema),
  jobDescriptionController.generate,
);

router.post(
  "/generate/stream",
  authMiddleware,
  authorizeRoles("employer"),
  aiGenerationRateLimitMiddleware,
  validateBody(generateJobDescriptionSchema),
  jobDescriptionController.stream,
);

export default router;
