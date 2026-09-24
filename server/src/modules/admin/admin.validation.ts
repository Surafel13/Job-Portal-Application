import { z } from "zod";

const objectIdSchema = z
    .string()
    .regex(/^[0-9a-fA-F]{24}$/, "Invalid ID.");

export const adminIdParamSchema = z
    .object({
        id: objectIdSchema,
    })
    .strict();

export const employerIdParamSchema = z
    .object({
        employerId: objectIdSchema,
    })
    .strict();

export const userIdParamSchema = z
    .object({
        userId: objectIdSchema,
    })
    .strict();

export const jobIdParamSchema = z
    .object({
        jobId: objectIdSchema,
    })
    .strict();
