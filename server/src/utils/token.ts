import jwt from "jsonwebtoken";
import env from "../config/env.js";
import type { SignOptions } from "jsonwebtoken";
import { UserRole } from "../modules/user/user.interface.js";

export type TokenPayload = {
    userId: string;
    role: UserRole;
};

const accessTokenOptions: SignOptions = {
    expiresIn: env.JWT_ACCESS_EXPIRES_IN as SignOptions["expiresIn"],
};

const refreshTokenOptions: SignOptions = {
    expiresIn: env.JWT_REFRESH_EXPIRES_IN as SignOptions["expiresIn"],
};

export const generateAccessToken = (payload: TokenPayload): string => {
    return jwt.sign(payload, env.JWT_ACCESS_SECRET, accessTokenOptions);
};

export const generateRefreshToken = (payload: TokenPayload): string => {
    return jwt.sign(payload, env.JWT_REFRESH_SECRET, refreshTokenOptions);
};

export const verifyAccessToken = (token: string): TokenPayload => {
    return jwt.verify(token, env.JWT_ACCESS_SECRET) as TokenPayload;
};

export const verifyRefreshToken = (token: string): TokenPayload => {
    return jwt.verify(token, env.JWT_REFRESH_SECRET) as TokenPayload;
};
