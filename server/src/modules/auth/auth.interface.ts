import type { Types } from "mongoose";
import type { IUser } from "../user/user.interface.js";
import { UserRole } from "../user/user.interface.js";
import type {
    RegisterInput,
    LoginInput,
    RefreshTokenInput,
    AuthUserIdParamInput,
} from "./auth.validation.js";

export type RegisterDto = RegisterInput;
export type LoginDto = LoginInput;
export type RefreshTokenDto = RefreshTokenInput;
export type AuthUserIdParamDto = AuthUserIdParamInput;

export interface TokenPayload {
    userId: string;
    role: UserRole;
}

export interface AuthTokens {
    accessToken: string;
    refreshToken: string;
}

export type SanitizedUser = Omit<IUser, "password" | "refreshToken">;

export interface AuthResponse extends AuthTokens {
    user: Partial<SanitizedUser>;
}

export interface AuthenticatedUser {
    userId: string;
    role: UserRole;
}

export interface IAuthService {
    register(data: RegisterDto): Promise<AuthResponse>;
    login(data: LoginDto): Promise<AuthResponse>;
    refresh(refreshToken: string): Promise<AuthTokens>;
    logout(userId: Types.ObjectId): Promise<void>;
    getProfile(userId: Types.ObjectId): Promise<Partial<SanitizedUser>>;
}