import { z } from "zod";

const objectIdSchema = z
    .string()
    .regex(/^[0-9a-fA-F]{24}$/, "Invalid skill ID.");

const slugSchema = z
    .string()
    .trim()
    .min(2, "Slug must be at least 2 characters.")
    .max(120, "Slug must not exceed 120 characters.")
    .regex(
        /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
        "Slug must contain only lowercase letters, numbers, and hyphens."
    );

export const skillIdParamSchema = z.object({
    id: objectIdSchema,
});

export const createSkillSchema = z.object({
    name: z
        .string()
        .trim()
        .min(2, "Skill name must be at least 2 characters.")
        .max(100, "Skill name must not exceed 100 characters."),
    slug: slugSchema,
    description: z
        .string()
        .trim()
        .max(500, "Description must not exceed 500 characters.")
        .optional(),
    isActive: z.boolean().optional(),
});

export const updateSkillSchema = z
    .object({
        name: z
            .string()
            .trim()
            .min(2, "Skill name must be at least 2 characters.")
            .max(100, "Skill name must not exceed 100 characters.")
            .optional(),
        slug: slugSchema.optional(),
        description: z
            .string()
            .trim()
            .max(500, "Description must not exceed 500 characters.")
            .optional(),
        isActive: z.boolean().optional(),
    })
    .refine(
        (data) => Object.keys(data).length > 0,
        "At least one field is required for update."
    );

export const skillQuerySchema = z.object({
    page: z.coerce.number().int().min(1).optional(),
    limit: z.coerce.number().int().min(1).max(100).optional(),
});

export type CreateSkillInput = z.infer<typeof createSkillSchema>;
export type UpdateSkillInput = z.infer<typeof updateSkillSchema>;
