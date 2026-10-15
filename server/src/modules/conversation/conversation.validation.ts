import { z } from "zod";

const objectIdSchema = z
    .string()
    .regex(/^[0-9a-fA-F]{24}$/, "Invalid ID.");

export const conversationIdParamSchema = z
    .object({
        conversationId: objectIdSchema,
    })
    .strict();

export const createConversationSchema = z
    .object({
        recipientId: objectIdSchema.optional(),
        jobId: objectIdSchema.optional(),
        applicationId: objectIdSchema.optional(),
        initialMessage: z.string().trim().max(5000).optional(),
    })
    .refine(
        (data) => data.recipientId || data.jobId || data.applicationId,
        {
            message: "At least one of recipientId, jobId, or applicationId must be provided.",
        }
    );

export const sendMessageSchema = z
    .object({
        content: z
            .string()
            .trim()
            .min(1, "Message content cannot be empty.")
            .max(5000, "Message content cannot exceed 5000 characters."),
    })
    .strict();

export const conversationQuerySchema = z
    .object({
        page: z.coerce.number().int().min(1).default(1),
        limit: z.coerce.number().int().min(1).max(100).default(20),
        search: z.string().trim().optional(),
    })
    .strict();

export const messageQuerySchema = z
    .object({
        page: z.coerce.number().int().min(1).default(1),
        limit: z.coerce.number().int().min(1).max(100).default(30),
        before: z.string().datetime({ offset: true }).optional().or(z.string().optional()),
    })
    .strict();

export type CreateConversationInput = z.infer<typeof createConversationSchema>;
export type SendMessageInput = z.infer<typeof sendMessageSchema>;
export type ConversationQueryInput = z.infer<typeof conversationQuerySchema>;
export type MessageQueryInput = z.infer<typeof messageQuerySchema>;
