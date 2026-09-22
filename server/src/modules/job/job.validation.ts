import { z } from "zod";

const objectIdSchema = z
    .string()
    .regex(
        /^[0-9a-fA-F]{24}$/,
        "Invalid ID."
    );

const salarySchema = z
    .object({
        minimum: z
            .number()
            .min(0, "Minimum salary cannot be negative.")
            .optional(),

        maximum: z
            .number()
            .min(0, "Maximum salary cannot be negative.")
            .optional(),

        currency: z
            .string()
            .trim()
            .length(3, "Currency must be 3 characters.")
            .optional(),
    })
    .strict()
    .refine(
        (salary) =>
            salary.minimum === undefined ||
            salary.maximum === undefined ||
            salary.minimum <= salary.maximum,
        {
            message:
                "Minimum salary cannot be greater than maximum salary.",
            path: ["minimum"],
        }
    );

export const createJobSchema = z
    .object({
        companyId: objectIdSchema,

        title: z
            .string()
            .trim()
            .min(2, "Job title must be at least 2 characters.")
            .max(150, "Job title must not exceed 150 characters."),

        description: z
            .string()
            .trim()
            .min(20, "Description must be at least 20 characters.")
            .max(
                10000,
                "Description must not exceed 10000 characters."
            ),

        requirements: z
            .array(z.string().trim().min(1))
            .min(1, "At least one requirement is required."),

        responsibilities: z
            .array(z.string().trim().min(1))
            .min(1, "At least one responsibility is required."),

        location: z
            .string()
            .trim()
            .min(2, "Location is required.")
            .max(150, "Location must not exceed 150 characters."),

        employmentType: z.enum([
            "full-time",
            "part-time",
            "contract",
            "internship",
            "freelance",
        ]),

        salary: salarySchema.optional(),

        experienceLevel: z
            .enum([
                "entry",
                "junior",
                "mid",
                "senior",
                "lead",
            ])
            .optional(),

        educationLevel: z
            .enum([
                "high-school",
                "certificate",
                "diploma",
                "bachelor",
                "master",
                "phd",
            ])
            .optional(),

        skills: z
            .array(objectIdSchema)
            .optional()
            .default([]),

        categoryId: objectIdSchema,

        status: z
            .enum([
                "draft",
                "pending",
                "published",
                "closed",
                "expired",
                "rejected",
            ])
            .optional()
            .default("draft"),

        publishedAt: z
            .coerce
            .date()
            .optional(),

        deadline: z
            .coerce
            .date()
            .optional(),

        viewCount: z
            .number()
            .int()
            .min(0)
            .optional()
            .default(0),
    })
    .strict();

export const updateJobSchema = z
    .object({
        title: z
            .string()
            .trim()
            .min(2, "Job title must be at least 2 characters.")
            .max(150, "Job title must not exceed 150 characters.")
            .optional(),

        description: z
            .string()
            .trim()
            .min(20, "Description must be at least 20 characters.")
            .max(
                10000,
                "Description must not exceed 10000 characters."
            )
            .optional(),

        requirements: z
            .array(z.string().trim().min(1))
            .min(1)
            .optional(),

        responsibilities: z
            .array(z.string().trim().min(1))
            .min(1)
            .optional(),

        location: z
            .string()
            .trim()
            .min(2)
            .max(150)
            .optional(),

        employmentType: z
            .enum([
                "full-time",
                "part-time",
                "contract",
                "internship",
                "freelance",
            ])
            .optional(),

        salary: salarySchema.optional(),

        experienceLevel: z
            .enum([
                "entry",
                "junior",
                "mid",
                "senior",
                "lead",
            ])
            .optional(),

        educationLevel: z
            .enum([
                "high-school",
                "certificate",
                "diploma",
                "bachelor",
                "master",
                "phd",
            ])
            .optional(),

        skills: z
            .array(objectIdSchema)
            .optional(),

        categoryId: objectIdSchema.optional(),

        deadline: z
            .coerce
            .date()
            .optional(),
    })
    .strict();

export const updateJobStatusSchema = z
    .object({
        status: z.enum([
            "draft",
            "pending",
            "published",
            "closed",
            "expired",
            "rejected",
        ]),
    })
    .strict();

export const jobIdParamSchema = z
    .object({
        id: objectIdSchema,
    })
    .strict();

export const companyIdParamSchema = z
    .object({
        companyId: objectIdSchema,
    })
    .strict();

export const categoryIdParamSchema = z
    .object({
        categoryId: objectIdSchema,
    })
    .strict();

export const jobStatusQuerySchema = z
    .object({
        status: z.enum([
            "draft",
            "pending",
            "published",
            "closed",
            "expired",
            "rejected",
        ]),
    })
    .strict();

export type CreateJobInput = z.infer<typeof createJobSchema>;
export type UpdateJobInput = z.infer<typeof updateJobSchema>;
export type UpdateJobStatusInput = z.infer<
    typeof updateJobStatusSchema
>;
export type JobIdParamInput = z.infer<typeof jobIdParamSchema>;
export type CompanyIdParamInput = z.infer<
    typeof companyIdParamSchema
>;
export type CategoryIdParamInput = z.infer<
    typeof categoryIdParamSchema
>;
export type JobStatusQueryInput = z.infer<
    typeof jobStatusQuerySchema
>;