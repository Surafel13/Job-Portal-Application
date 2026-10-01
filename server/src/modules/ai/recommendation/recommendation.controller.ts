import type { Request, Response } from "express";
import RecommendationService from "./recommendation.service.js";
import sendResponse from "../../../utils/sendResponse.js";
import asyncHandler from "../../../utils/asyncHandler.js";
import { ApiError } from "../../../utils/ApiError.js";

class RecommendationController {
  private recommendationService = RecommendationService;

  getRecommendation = asyncHandler(
    async (req: Request, res: Response): Promise<void> => {
      if (!req.user) {
        throw new ApiError(401, "Authentication required.");
      }

      const userId = req.user.userId;

      const recommendation =
        await this.recommendationService.getRecommendedJobs(userId);

      sendResponse(
        res,
        200,
        "Job recommendations retrieved successfully.",
        recommendation,
      );
    },
  );
}

export default new RecommendationController();
