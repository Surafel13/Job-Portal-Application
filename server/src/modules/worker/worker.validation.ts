import { z } from "zod";

const objectIdSchema = z
    .string()
    .regex(/^[0-9a-fA-F]{24}$/, "Invalid ID.");

const workerSkillSchema = z.object({
    skillId: objectIdSchema,
    name: z.string().trim().min(1).max(100),
    level: z.enum(["beginner", "intermediate", "advanced", "expert"]).optional(),
});

const educationSchema = z.object({
    institution: z.string().trim().min(1).max(150),
    degree: z.string().trim().min(1).max(150),
    fieldOfStudy: z.string().trim().max(150).optional(),
    startDate: z.coerce.date().optional(),
    endDate: z.coerce.date().optional(),
    description: z.string().trim().max(1000).optional(),
});

const experienceSchema = z.object({
    company: z.string().trim().min(1).max(150),
    jobTitle: z.string().trim().min(1).max(150),
    location: z.string().trim().max(150).optional(),
    startDate: z.coerce.date(),
    endDate: z.coerce.date().optional(),
    isCurrent: z.boolean().default(false),
    description: z.string().trim().max(2000).optional(),
});

const workerProfileSchema = z.object({
    professionalSummary: z.string().trim().max(2000).optional(),
    skills: z.array(workerSkillSchema).optional(),
    education: z.array(educationSchema).optional(),
    experience: z.array(experienceSchema).optional(),
    location: z.string().trim().max(150).optional(),
    preferredJobTypes: z.array(
        z.enum(["full-time", "part-time", "contract", "internship", "freelance"])
    ).optional(),
    preferredLocations: z.array(z.string().trim().min(1).max(150)).optional(),
    preferredWorkTypes: z.array(
        z.enum(["onsite", "remote", "hybrid"])
    ).optional(),
    minimumSalary: z.number().min(0).optional(),
    maximumSalary: z.number().min(0).optional(),
    resumeIds: z.array(objectIdSchema).optional(),
    availableFrom: z.coerce.date().optional(),
    website: z.string().url("Invalid website URL.").optional(),
    linkedin: z.string().url("Invalid LinkedIn URL.").optional(),
    github: z.string().url("Invalid GitHub URL.").optional(),
});

export const createWorkerSchema = workerProfileSchema.strict();

export const updateWorkerSchema = workerProfileSchema
    .strict()
    .refine(
        (data) => Object.keys(data).length > 0,
        "At least one field is required for update."
    );

export const workerUserIdParamSchema = z.object({
    userId: objectIdSchema,
});

export type CreateWorkerInput = z.infer<typeof createWorkerSchema>;
export type UpdateWorkerInput = z.infer<typeof updateWorkerSchema>;
