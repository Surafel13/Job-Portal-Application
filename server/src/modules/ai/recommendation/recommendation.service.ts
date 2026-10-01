import { ApiError } from "../../../utils/ApiError.js";
import { RecommendationRepository } from "./recommendation.repository.js";
import { recommendationJobPrompt } from "../prompt/remcommedation.prompt.js";
import { gemini } from "../../../config/gemini.js";

interface RecommendedJob {
  jobId: string;
  title: string;
  recommendationPercentage: number;
  reason: string;
}

interface RecommendationResult {
  totalRecommendedJobs: number;
  recommendedJobs: RecommendedJob[];
}

export class RecommendationService {
  private recommendationRepository = new RecommendationRepository();

  async getRecommendedJobs(userId: string): Promise<RecommendationResult> {
    try {
      const workerProfile =
        await this.recommendationRepository.getWorkerProfileById(userId);

      if (!workerProfile) {
        throw new ApiError(400, "Build your worker profile first.");
      }

      const categoryIds = workerProfile.categoryIds;

      if (!categoryIds || categoryIds.length === 0) {
        throw new ApiError(
          400,
          "Add at least one job category to your worker profile.",
        );
      }

      const relatedJobsByCategory =
        await this.recommendationRepository.getJobsByCategoryThatArePublished(
          categoryIds,
        );

      if (relatedJobsByCategory.length === 0) {
        return {
          totalRecommendedJobs: 0,
          recommendedJobs: [],
        };
      }

      const prompt = recommendationJobPrompt(
        workerProfile,
        relatedJobsByCategory,
      );

      const response = await gemini.models.generateContent({
        model: "gemini-2.5-flash",
        contents: prompt,
      });

      const generatedText = response.text;

      if (!generatedText) {
        throw new ApiError(
          502,
          "The recommendation service returned an empty response.",
        );
      }

      const cleanedResponse = generatedText
        .replace(/```json/gi, "")
        .replace(/```/g, "")
        .trim();

      let parsedResponse: RecommendationResult;

      try {
        parsedResponse = JSON.parse(cleanedResponse);
      } catch {
        throw new ApiError(
          502,
          "The recommendation service returned an invalid response.",
        );
      }

      if (!parsedResponse || !Array.isArray(parsedResponse.recommendedJobs)) {
        throw new ApiError(502, "Invalid recommendation response format.");
      }

      const availableJobs = new Map(
        relatedJobsByCategory.map((job) => [job._id?.toString(), job]),
      );

      const validRecommendations: RecommendedJob[] =
        parsedResponse.recommendedJobs
          .filter((recommendation) => {
            if (!recommendation) {
              return false;
            }

            if (!recommendation.jobId || !recommendation.title) {
              return false;
            }

            if (!availableJobs.has(recommendation.jobId)) {
              return false;
            }

            if (
              typeof recommendation.recommendationPercentage !== "number" ||
              recommendation.recommendationPercentage < 50 ||
              recommendation.recommendationPercentage > 100
            ) {
              return false;
            }

            if (
              !recommendation.reason ||
              typeof recommendation.reason !== "string"
            ) {
              return false;
            }

            return true;
          })
          .slice(0, 5)
          .sort(
            (a, b) => b.recommendationPercentage - a.recommendationPercentage,
          );

      return {
        totalRecommendedJobs: validRecommendations.length,
        recommendedJobs: validRecommendations,
      };
    } catch (error) {
      if (error instanceof ApiError) {
        throw error;
      }

      console.error("Recommendation service error:", error);

      throw new ApiError(500, "Failed to generate job recommendations.");
    }
  }
}

export const recommendationService = new RecommendationService();

export default recommendationService;
