import { z } from "zod";

export const createApplicantSchema = z.object({
    body: z.object({
        resumeId: z.string().min(1, "Resume ID is required"),
        skills: z.array(
            z.string().min(1, "Skill ID is required")
        ).optional(),
        experience: z.number().min(0).optional(),
        education: z.string().trim().optional(),
        bio: z.string().trim().optional(),
        phone: z.string().trim().optional(),
        location: z.string().trim().optional(),
    }),
});

export const updateApplicantSchema = z.object({
    body: z.object({
        resumeId: z.string().min(1).optional(),
        skills: z.array(
            z.string().min(1, "Skill ID is required")
        ).optional(),
        experience: z.number().min(0).optional(),
        education: z.string().trim().optional(),
        bio: z.string().trim().optional(),
        phone: z.string().trim().optional(),
        location: z.string().trim().optional(),
        status: z.enum([
            "active",
            "inactive",
            "blocked",
        ]).optional(),
    }),
});

export const applicantIdSchema = z.object({
    params: z.object({
        id: z.string().min(1, "Applicant ID is required"),
    }),
});