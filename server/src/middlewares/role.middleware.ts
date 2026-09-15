import type { RequestHandler } from "express";
import type { UserRole } from "../modules/user/user.interface.js";
import { ApiError } from "../utils/ApiError.js";

export const authorizeRoles = (
    ...allowedRoles: UserRole[]
): RequestHandler => {
    return (req, _res, next): void => {
        if (!req.user) {
            next(new ApiError(401, "Authentication required."));
            return;
        }

        if (!allowedRoles.includes(req.user.role)) {
            next(
                new ApiError(
                    403,
                    "You do not have permission to access this resource."
                )
            );
            return;
        }

        next();
    };
};

export default authorizeRoles;
