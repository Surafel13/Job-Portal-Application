import { z } from "zod";

const objectIdSchema = z
    .string()
    .regex(/^[0-9a-fA-F]{24}$/, "Invalid ID.");

const notificationTypeSchema = z.enum([
    "application",
    "job",
    "interview",
    "message",
    "report",
    "employer",
    "system",
]);

const notificationPrioritySchema = z.enum([
    "low",
    "medium",
    "high",
]);

export const notificationIdParamSchema = z
    .object({
        notificationId: objectIdSchema,
    })
    .strict();

export const notificationTypeParamSchema = z
    .object({
        type: notificationTypeSchema,
    })
    .strict();

export const createNotificationSchema = z
    .object({
        userId: objectIdSchema,

        type: notificationTypeSchema,

        title: z
            .string()
            .trim()
            .min(1)
            .max(200),

        message: z
            .string()
            .trim()
            .min(1)
            .max(2000),

        priority: notificationPrioritySchema
            .optional(),

        resourceType: z
            .string()
            .trim()
            .min(1)
            .max(100)
            .optional(),

        resourceId: objectIdSchema.optional(),
    })
    .strict();

export type CreateNotificationInput = z.infer<
    typeof createNotificationSchema
>;