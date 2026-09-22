import { z } from "zod";

const objectIdSchema = z
    .string()
    .regex(/^[0-9a-fA-F]{24}$/, "Invalid ID.");

export const jobIdParamSchema = z.object({
    jobId: objectIdSchema,
});

export const savedJobIdParamSchema = z.object({
    id: objectIdSchema,
});