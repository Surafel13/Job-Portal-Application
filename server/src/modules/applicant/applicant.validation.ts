import { z } from "zod";

const objectIdSchema = z
    .string()
    .regex(/^[0-9a-fA-F]{24}$/, "Invalid ID.");

export const createApplicantSchema = z
    .object({
        resumeId: objectIdSchema,
        skills: z.array(objectIdSchema).optional(),
        experience: z.number().min(0).optional(),
        education: z.string().trim().optional(),
        bio: z.string().trim().optional(),
        phone: z.string().trim().optional(),
        location: z.string().trim().optional(),
    })
    .strict();

export const updateApplicantSchema = z
    .object({
        resumeId: objectIdSchema.optional(),
        skills: z.array(objectIdSchema).optional(),
        experience: z.number().min(0).optional(),
        education: z.string().trim().optional(),
        bio: z.string().trim().optional(),
        phone: z.string().trim().optional(),
        location: z.string().trim().optional(),
        status: z.enum(["active", "inactive", "blocked"]).optional(),
    })
    .strict()
    .refine(
        (data) => Object.keys(data).length > 0,
        "At least one field is required for update."
    );

export const applicantIdSchema = z.object({
    id: objectIdSchema,
});
