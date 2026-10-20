import { z } from "zod";

const objectIdSchema = z
    .string()
    .regex(/^[0-9a-fA-F]{24}$/, "Invalid ID.");

export const createApplicationSchema = z
    .object({
        resumeId: objectIdSchema,
        coverLetter: z
            .string()
            .trim()
            .max(5000, "Cover letter cannot exceed 5000 characters.")
            .optional()
            .transform((value) => (value ? value : undefined)),
    })
    .strict();

export const updateApplicationStatusSchema = z
    .object({
        status: z.enum([
            "pending",
            "reviewing",
            "shortlisted",
            "interview",
            "accepted",
            "rejected",
        ]),
    })
    .strict();

export const applicationIdSchema = z.object({
    id: objectIdSchema,
});

export const jobIdSchema = z.object({
    jobId: objectIdSchema,
});

export type CreateApplicationInput = {
    resumeId: string;
    coverLetter?: string;
};
