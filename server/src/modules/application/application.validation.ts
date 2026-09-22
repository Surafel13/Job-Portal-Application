import { z } from "zod";

export const createApplicationSchema = z.object({
    body: z.object({
        resumeId: z.string().min(1, "Resume ID is required"),
        coverLetter: z.string().trim().optional(),
    }),
});

export const updateApplicationStatusSchema = z.object({
    body: z.object({
        status: z.enum([
            "pending",
            "reviewing",
            "shortlisted",
            "interview",
            "accepted",
            "rejected",
            "withdrawn",
        ]),
    }),
});

export const applicationIdSchema = z.object({
    params: z.object({
        id: z.string().min(1, "Application ID is required"),
    }),
});

export const jobIdSchema = z.object({
    params: z.object({
        jobId: z.string().min(1, "Job ID is required"),
    }),
});