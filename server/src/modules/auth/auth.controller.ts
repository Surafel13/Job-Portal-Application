import type { Request, Response } from "express";
import { Types } from "mongoose";
import authService from "./auth.service.js";
import { ApiError } from "../../utils/ApiError.js";
import sendResponse from "../../utils/sendResponse.js";

const getAuthUser = (req: Request) => {
    if (!req.user) {
        throw new ApiError(401, "Unauthorized");
    }

    return req.user;
};

export const register = async (
    req: Request,
    res: Response
): Promise<void> => {
    const result = await authService.register(req.body);

    sendResponse(
        res,
        201,
        "User registered successfully.",
        result
    );
};

export const login = async (
    req: Request,
    res: Response
): Promise<void> => {
    const result = await authService.login(req.body);

    sendResponse(
        res,
        200,
        "Login successful.",
        result
    );
};

export const refresh = async (
    req: Request,
    res: Response
): Promise<void> => {
    const { refreshToken } = req.body;

    const tokens = await authService.refresh(refreshToken);

    sendResponse(
        res,
        200,
        "Token refreshed successfully.",
        tokens
    );
};

export const logout = async (
    req: Request,
    res: Response
): Promise<void> => {
    const { userId } = getAuthUser(req);

    await authService.logout(
        new Types.ObjectId(userId)
    );

    sendResponse(
        res,
        200,
        "Logged out successfully."
    );
};

export const getProfile = async (
    req: Request,
    res: Response
): Promise<void> => {
    const { userId } = getAuthUser(req);

    const user = await authService.getProfile(
        new Types.ObjectId(userId)
    );

    sendResponse(
        res,
        200,
        "Profile fetched successfully.",
        user
    );
};

export default {
    register,
    login,
    refresh,
    logout,
    getProfile,
};