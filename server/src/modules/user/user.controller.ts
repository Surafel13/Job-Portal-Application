import type { Request, Response } from "express";
import type { Types } from "mongoose";
import sendResponse from "../../utils/sendResponse.js";
import { userService } from "./user.service.js";
import type {
    UpdateUserInput,
    UpdateUserStatusInput,
    UserQueryInput,
} from "./user.validation.js";

export const getUserById = async (
    req: Request,
    res: Response
): Promise<void> => {
    const user = await userService.getUserById(
        req.params.id as unknown as Types.ObjectId
    );

    sendResponse(
        res,
        200,
        "User retrieved successfully.",
        user
    );
};

export const getUserByEmail = async (
    req: Request,
    res: Response
): Promise<void> => {
    const email = req.query.email as string;

    const user = await userService.getUserByEmail(email);

    sendResponse(
        res,
        200,
        "User retrieved successfully.",
        user
    );
};

export const getUsersByRole = async (
    req: Request,
    res: Response
): Promise<void> => {
    const { role } = req.query as unknown as UserQueryInput;

    if (!role) {
        sendResponse(
            res,
            400,
            "Role is required.",
            undefined,
            { field: "role" }
        );
        return;
    }

    const users = await userService.getUsersByRole(role);

    sendResponse(
        res,
        200,
        "Users retrieved successfully.",
        users
    );
};

export const updateUser = async (
    req: Request,
    res: Response
): Promise<void> => {
    const user = await userService.updateUser(
        req.params.id as unknown as Types.ObjectId,
        req.body as UpdateUserInput
    );

    sendResponse(
        res,
        200,
        "User updated successfully.",
        user
    );
};

export const updateUserStatus = async (
    req: Request,
    res: Response
): Promise<void> => {
    const { status } = req.body as UpdateUserStatusInput;

    const user = await userService.updateUserStatus(
        req.params.id as unknown as Types.ObjectId,
        status
    );

    sendResponse(
        res,
        200,
        "User status updated successfully.",
        user
    );
};

export const deleteUser = async (
    req: Request,
    res: Response
): Promise<void> => {
    await userService.deleteUser(
        req.params.id as unknown as Types.ObjectId
    );

    sendResponse(
        res,
        200,
        "User deleted successfully."
    );
};