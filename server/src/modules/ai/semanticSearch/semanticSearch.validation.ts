import { z } from "zod";

export const semanticSearchQuerySchema = z
    .object({
        q: z.string().trim().min(2).max(500),
        location: z.string().trim().min(1).max(150).optional(),
        employmentType: z
            .enum([
                "full-time",
                "part-time",
                "contract",
                "internship",
                "freelance",
            ])
            .optional(),
        categoryId: z
            .string()
            .regex(/^[0-9a-fA-F]{24}$/)
            .optional(),
        page: z.coerce.number().int().min(1).default(1),
        limit: z.coerce.number().int().min(1).max(50).default(10),
    })
    .strict();

export const semanticReindexSchema = z
    .object({
        afterId: z
            .string()
            .regex(/^[0-9a-fA-F]{24}$/)
            .optional(),
        limit: z.coerce.number().int().min(1).max(50).default(25),
    })
    .strict();

export type SemanticSearchQuery = z.infer<
    typeof semanticSearchQuerySchema
>;
export type SemanticReindexInput = z.infer<
    typeof semanticReindexSchema
>;