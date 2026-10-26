import { z } from "zod";
import { ApiError } from "../../../utils/ApiError.js";
import type { IGeneratedJobDescription } from "./jobDescription.interface.js";

const listItem = z.string().trim().min(1).max(300);

const generatedSchema = z.object({
  description: z.string().trim().min(20).max(4000),
  responsibilities: z.array(listItem).min(3).max(12),
  requirements: z.array(listItem).min(3).max(12),
});

export const parseGeneratedJobDescription = (
  raw: string,
): IGeneratedJobDescription => {
  const cleaned = raw
    .replace(/```json/gi, "")
    .replace(/```/g, "")
    .trim();

  let json: unknown;
  try {
    json = JSON.parse(cleaned);
  } catch {
    throw new ApiError(
      502,
      "The AI service returned an invalid response. Please try again.",
    );
  }

  const result = generatedSchema.safeParse(json);
  if (!result.success) {
    throw new ApiError(
      502,
      "The AI service returned an incomplete job description. Please try again.",
    );
  }

  return result.data;
};
