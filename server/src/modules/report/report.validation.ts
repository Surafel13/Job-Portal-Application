import { z } from "zod";

const objectIdSchema = z
    .string()
    .regex(/^[0-9a-fA-F]{24}$/, "Invalid ID.");

const resourceTypeSchema = z.enum([
    "user",
    "employer",
    "job",
    "content",
]);

const reportReasonSchema = z.enum([
    "spam",
    "fraud",
    "inappropriate_content",
    "misleading_information",
    "harassment",
    "scam",
    "duplicate",
    "other",
]);

const reportStatusSchema = z.enum([
    "pending",
    "reviewing",
    "resolved",
    "rejected",
]);

export const reportIdParamSchema = z
    .object({
        reportId: objectIdSchema,
    })
    .strict();

export const resourceParamSchema = z
    .object({
        resourceType: resourceTypeSchema,
        resourceId: objectIdSchema,
    })
    .strict();

export const createReportSchema = z
    .object({
        resourceType: resourceTypeSchema,
        resourceId: objectIdSchema,
        reason: reportReasonSchema,
        description: z
            .string()
            .trim()
            .min(1)
            .max(2000)
            .optional(),
    })
    .strict();

export const reportStatusQuerySchema = z
    .object({
        status: reportStatusSchema,
    })
    .strict();

export const reviewReportSchema = z
    .object({
        adminDecision: z
            .string()
            .trim()
            .min(1)
            .max(2000),
    })
    .strict();

export type CreateReportInput = z.infer<
    typeof createReportSchema
>;

export type ReviewReportInput = z.infer<
    typeof reviewReportSchema
>;