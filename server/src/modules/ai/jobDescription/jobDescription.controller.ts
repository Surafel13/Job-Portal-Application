import type { Request, Response } from "express";
import asyncHandler from "../../../utils/asyncHandler.js";
import sendResponse from "../../../utils/sendResponse.js";
import { ApiError } from "../../../utils/ApiError.js";
import jobDescriptionService from "./jobDescription.service.js";
import type { GenerateJobDescriptionInput } from "./jobDescription.validation.js";

class JobDescriptionController {
  generate = asyncHandler(
    async (req: Request, res: Response): Promise<void> => {
      if (!req.user) {
        throw new ApiError(401, "Authentication required.");
      }

      console.log("Request body:", req.body);

      const result = await jobDescriptionService.generate(
        req.user.userId,
        req.body as GenerateJobDescriptionInput,
      );

      sendResponse(res, 200, "Job description generated successfully.", result);
    },
  );
}

export const jobDescriptionController = new JobDescriptionController();

export default jobDescriptionController;
