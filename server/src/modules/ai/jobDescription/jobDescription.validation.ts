import { z } from "zod";

export const generateJobDescriptionSchema = z
    .object({
        title: z
            .string()
            .trim()
            .min(2, "Job title must be at least 2 characters.")
            .max(150, "Job title must not exceed 150 characters."),

        skills: z
            .array(z.string().trim().min(1).max(60))
            .min(1, "Select at least one skill.")
            .max(15, "Select no more than 15 skills."),

        experienceLevel: z.enum(["entry", "junior", "mid", "senior", "lead"]),

        employmentType: z.enum([
            "full-time",
            "part-time",
            "contract",
            "internship",
            "freelance",
        ]),
    })
    .strict();

export type GenerateJobDescriptionInput = z.infer<
    typeof generateJobDescriptionSchema
>;
