import { z } from "zod";

const emailSchema = z
    .email("Invalid email address.")
    .trim()
    .toLowerCase();

const passwordSchema = z
    .string()
    .min(8, "Password must be at least 8 characters.")
    .max(128, "Password must not exceed 128 characters.");

export const registerSchema = z
    .object({
        fullName: z
            .string()
            .trim()
            .min(2, "Full name must be at least 2 characters.")
            .max(100, "Full name must not exceed 100 characters."),

        email: emailSchema,

        password: passwordSchema,

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

        companyName: z
            .string()
            .trim()
            .min(2, "Company name must be at least 2 characters.")
            .max(150, "Company name must not exceed 150 characters.")
            .optional(),

        role: z.enum(["worker", "employer"]),
    })
    .refine(
        (data) => data.role !== "employer" || Boolean(data.companyName),
        {
            message: "Company name is required for employer registration.",
            path: ["companyName"],
        }
    )
    .strict();

export const loginSchema = z
    .object({
        email: emailSchema,
        password: passwordSchema,
    })
    .strict();

export const refreshTokenSchema = z
    .object({
        refreshToken: z
            .string()
            .min(1, "Refresh token is required."),
    })
    .strict();

export const authUserIdParamSchema = z
    .object({
        id: z
            .string()
            .regex(
                /^[0-9a-fA-F]{24}$/,
                "Invalid user ID."
            ),
    })
    .strict();

export type RegisterInput = z.infer<typeof registerSchema>;

export type LoginInput = z.infer<typeof loginSchema>;

export type RefreshTokenInput = z.infer<typeof refreshTokenSchema>;

export type AuthUserIdParamInput = z.infer<
    typeof authUserIdParamSchema
>;
