import { z } from "zod";

const objectIdSchema = z
    .string()
    .regex(/^[0-9a-fA-F]{24}$/, "Invalid user ID.");

export const userIdParamSchema = z.object({
    id: objectIdSchema,
});

export const userRoleSchema = z.enum([
    "worker",
    "employer",
    "admin",
    "superAdmin",
]);

export const userStatusSchema = z.enum([
    "active",
    "suspended",
    "deactivated",
]);

export const updateUserSchema = z
    .object({
        fullName: z
            .string()
            .trim()
            .min(2, "Full name must be at least 2 characters.")
            .max(100, "Full name must not exceed 100 characters.")
            .optional(),

        email: z
            .email("Invalid email address.")
            .trim()
            .toLowerCase()
            .optional(),

        phone: z
            .string()
            .trim()
            .max(20, "Phone number must not exceed 20 characters.")
            .optional(),

        profileImage: z
            .string()
            .url("Invalid profile image URL.")
            .optional(),

        bio: z
            .string()
            .trim()
            .max(1000, "Bio must not exceed 1000 characters.")
            .optional(),

        location: z
            .string()
            .trim()
            .max(150, "Location must not exceed 150 characters.")
            .optional(),
    })
    .strict();

export const updateUserStatusSchema = z
    .object({
        status: userStatusSchema,
    })
    .strict();

export const updateUserRoleSchema = z
    .object({
        role: userRoleSchema,
    })
    .strict();

export const userQuerySchema = z
    .object({
        role: userRoleSchema.optional(),

        status: userStatusSchema.optional(),

        search: z
            .string()
            .trim()
            .min(1, "Search query cannot be empty.")
            .max(100, "Search query must not exceed 100 characters.")
            .optional(),

        page: z.coerce
            .number()
            .int()
            .min(1, "Page must be at least 1.")
            .default(1),

        limit: z.coerce
            .number()
            .int()
            .min(1, "Limit must be at least 1.")
            .max(100, "Limit cannot exceed 100.")
            .default(10),

        sortBy: z
            .enum([
                "fullName",
                "email",
                "createdAt",
                "updatedAt",
                "lastLogin",
            ])
            .default("createdAt"),

        sortOrder: z
            .enum(["asc", "desc"])
            .default("desc"),
    })
    .strict();

export const changePasswordSchema = z
    .object({
        currentPassword: z
            .string()
            .min(8, "Current password must be at least 8 characters.")
            .max(128, "Current password must not exceed 128 characters."),

        newPassword: z
            .string()
            .min(8, "New password must be at least 8 characters.")
            .max(128, "New password must not exceed 128 characters."),

        confirmPassword: z
            .string()
            .min(8, "Password confirmation must be at least 8 characters.")
            .max(128, "Password confirmation must not exceed 128 characters."),
    })
    .refine(
        (data) => data.newPassword === data.confirmPassword,
        {
            message: "Passwords do not match.",
            path: ["confirmPassword"],
        }
    )
    .refine(
        (data) => data.currentPassword !== data.newPassword,
        {
            message: "New password must be different from current password.",
            path: ["newPassword"],
        }
    )
    .strict();

export type UpdateUserInput = z.infer<
    typeof updateUserSchema
>;

export type UpdateUserStatusInput = z.infer<
    typeof updateUserStatusSchema
>;

export type UpdateUserRoleInput = z.infer<
    typeof updateUserRoleSchema
>;

export type UserQueryInput = z.infer<
    typeof userQuerySchema
>;

export type ChangePasswordInput = z.infer<
    typeof changePasswordSchema
>;