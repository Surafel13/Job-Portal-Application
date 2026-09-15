import { z } from "zod";

export const resumeIdParamSchema = z.object({
    id: z.string().regex(/^[0-9a-fA-F]{24}$/, "Invalid resume ID."),
});

export const createResumeSchema = z.object({}).strict();
