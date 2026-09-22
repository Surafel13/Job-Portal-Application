import { z } from "zod";

export const searchJobsSchema = z.object({
    keyword: z.string().trim().optional(),
    location: z.string().trim().optional(),

    employmentType: z
        .enum([
            "fullTime",
            "partTime",
            "contract",
            "internship",
            "freelance",
        ])
        .optional(),

    categoryId: z
        .string()
        .regex(/^[0-9a-fA-F]{24}$/)
        .optional(),

    skillIds: z
        .string()
        .optional(),

    page: z.coerce
        .number()
        .int()
        .min(1)
        .default(1),

    limit: z.coerce
        .number()
        .int()
        .min(1)
        .max(100)
        .default(10),
});