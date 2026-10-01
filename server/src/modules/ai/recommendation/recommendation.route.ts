import { Router } from "express";
import recommendationController from "./recommendation.controller.js";
import authMiddleware from "../../../middlewares/auth.middleware.js";

const router = Router();

router.get("/", authMiddleware, recommendationController.getRecommendation);

export default router;
