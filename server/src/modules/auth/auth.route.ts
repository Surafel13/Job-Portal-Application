// auth.route.ts
import { Router } from "express";
import * as authController from "./auth.controller.js";
import { validateBody } from "../../middlewares/validation.middleware.js";
import {
  registerSchema,
  loginSchema,
  refreshTokenSchema,
  forgotPasswordSchema,
  verifyResetOtpSchema,
  resetPasswordSchema,
} from "./auth.validation.js";
import asyncHandler from "../../utils/asyncHandler.js";
import authMiddleware from "../../middlewares/auth.middleware.js";

const router = Router();

router.post(
  "/register",
  validateBody(registerSchema),
  asyncHandler(authController.register),
);

router.post(
  "/login",
  validateBody(loginSchema),
  asyncHandler(authController.login),
);

router.post(
  "/refresh",
  validateBody(refreshTokenSchema),
  asyncHandler(authController.refresh),
);

router.post("/logout", asyncHandler(authController.logout));

router.get("/me", authMiddleware, asyncHandler(authController.getProfile));

router.post(
  "/forgot-password",
  validateBody(forgotPasswordSchema),
  asyncHandler(authController.forgotPassword),
);

router.post(
  "/verify-reset-otp",
  validateBody(verifyResetOtpSchema),
  asyncHandler(authController.verifyResetOtp),
);

router.post(
  "/reset-password",
  validateBody(resetPasswordSchema),
  asyncHandler(authController.resetPassword),
);

export default router;
