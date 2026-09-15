import { z } from "zod";

const companySizeSchema = z.enum([
    "1-10",
    "11-50",
    "51-200",
    "201-500",
    "501-1000",
    "1001-5000",
    "5001+",
]);

const companyFieldsSchema = z.object({
    name: z
        .string()
        .trim()
        .min(2, "Company name must be at least 2 characters.")
        .max(150, "Company name must not exceed 150 characters."),
    website: z.string().url("Invalid website URL.").optional(),
    industry: z.string().trim().max(100).optional(),
    size: companySizeSchema.optional(),
    headquarters: z.string().trim().max(150).optional(),
    description: z.string().trim().max(2000).optional(),
    logo: z.string().url("Invalid logo URL.").optional(),
});

export const companyIdParamSchema = z.object({
    id: z.string().regex(/^[0-9a-fA-F]{24}$/, "Invalid company ID."),
});

export const createCompanySchema = companyFieldsSchema.strict();

export const updateCompanySchema = companyFieldsSchema
    .partial()
    .strict()
    .refine(
        (data) => Object.keys(data).length > 0,
        "At least one field is required for update."
    );

export const companyQuerySchema = z.object({
    page: z.coerce.number().int().min(1).optional(),
    limit: z.coerce.number().int().min(1).max(100).optional(),
});

export type CreateCompanyInput = z.infer<typeof createCompanySchema>;
export type UpdateCompanyInput = z.infer<typeof updateCompanySchema>;
