import { Types } from "mongoose";
import authRepository from "./auth.repository.js";
import type { IUser } from "../user/user.interface.js";
import { ApiError } from "../../utils/ApiError.js";
import {
    hashPassword,
    comparePassword,
} from "../../utils/password.js";
import {
    generateAccessToken,
    generateRefreshToken,
    verifyRefreshToken,
    type TokenPayload,
} from "../../utils/token.js";
import type {
    RegisterDto,
    LoginDto,
    AuthTokens,
    AuthResponse,
    SanitizedUser,
} from "./auth.interface.js";
import WorkerRepository from "../worker/worker.repository.js";
import CompanyRepository from "../company/company.repository.js";

export class AuthService {
    constructor(
        private readonly workerRepository = new WorkerRepository(),
        private readonly companyRepository = new CompanyRepository()
    ) {}

    private buildTokenPayload(user: IUser): TokenPayload {
        if (!user._id) {
            throw new ApiError(500, "User ID is missing.");
        }

        return {
            userId: user._id.toString(),
            role: user.role,
        };
    }

    private generateTokens(user: IUser): AuthTokens {
        const payload = this.buildTokenPayload(user);

        return {
            accessToken: generateAccessToken(payload),
            refreshToken: generateRefreshToken(payload),
        };
    }

    private sanitizeUser(user: IUser): Partial<SanitizedUser> {
        const {
            password: _password,
            refreshToken: _refreshToken,
            ...safeUser
        } = user;

        return safeUser;
    }

    private async createRoleProfile(
        user: IUser,
        companyName?: string
    ): Promise<void> {
        if (!user._id) {
            throw new ApiError(500, "User ID is missing.");
        }

        if (user.role === "worker") {
            await this.workerRepository.create({
                userId: user._id,
                skills: [],
                education: [],
                experience: [],
                preferredJobTypes: [],
                preferredLocations: [],
                preferredWorkTypes: [],
                resumeIds: [],
                profileCompletion: 0,
            });
            return;
        }

        if (user.role === "employer" && companyName) {
            await this.companyRepository.create({
                name: companyName,
                verificationStatus: "pending",
                recruiters: [user._id],
            });
        }
    }

    async register(data: RegisterDto): Promise<AuthResponse> {
        const email = data.email.toLowerCase().trim();

        if (data.role === "employer" && data.companyName) {
            const existingCompany = await this.companyRepository.findByName(
                data.companyName
            );

            if (existingCompany) {
                throw new ApiError(409, "Company name already exists.");
            }
        }

        const exists = await authRepository.existsByEmail(email);

        if (exists) {
            throw new ApiError(
                409,
                "User with this email already exists."
            );
        }

        const hashedPassword = await hashPassword(data.password);

        const userData: IUser = {
            fullName: data.fullName,
            email,
            password: hashedPassword,
            role: data.role,
            status: "active",
            phone: data.phone,
            profileImage: data.profileImage,
            bio: data.bio,
            location: data.location,
        };

        const user = await authRepository.createUser(userData);

        if (!user._id) {
            throw new ApiError(500, "User ID is missing.");
        }

        await this.createRoleProfile(user, data.companyName);

        const tokens = this.generateTokens(user);
        const hashedRefreshToken = await hashPassword(
            tokens.refreshToken
        );

        await authRepository.updateRefreshToken(
            user._id,
            hashedRefreshToken
        );

        return {
            user: this.sanitizeUser(user),
            ...tokens,
        };
    }

    async login(data: LoginDto): Promise<AuthResponse> {
        const email = data.email.toLowerCase().trim();

        const user =
            await authRepository.findUserByEmailWithPassword(email);

        if (!user) {
            throw new ApiError(
                401,
                "Invalid email or password."
            );
        }

        const isPasswordValid = await comparePassword(
            data.password,
            user.password
        );

        if (!isPasswordValid) {
            throw new ApiError(
                401,
                "Invalid email or password."
            );
        }

        if (user.status !== "active") {
            throw new ApiError(
                403,
                "Your account is not active."
            );
        }

        if (!user._id) {
            throw new ApiError(500, "User ID is missing.");
        }

        const tokens = this.generateTokens(user);

        const hashedRefreshToken = await hashPassword(
            tokens.refreshToken
        );

        await authRepository.updateRefreshToken(
            user._id,
            hashedRefreshToken
        );

        return {
            user: this.sanitizeUser(user),
            ...tokens,
        };
    }

    async refresh(refreshToken: string): Promise<AuthTokens> {
        if (!refreshToken) {
            throw new ApiError(
                401,
                "Refresh token is required."
            );
        }

        let payload: TokenPayload;

        try {
            payload = verifyRefreshToken(refreshToken);
        } catch {
            throw new ApiError(
                401,
                "Invalid or expired refresh token."
            );
        }

        if (!Types.ObjectId.isValid(payload.userId)) {
            throw new ApiError(
                401,
                "Invalid refresh token."
            );
        }

        const userId = new Types.ObjectId(payload.userId);

        const user =
            await authRepository.findUserByIdWithRefreshToken(
                userId
            );

        if (!user || !user.refreshToken) {
            throw new ApiError(
                401,
                "Refresh token not recognized."
            );
        }

        const isValid = await comparePassword(
            refreshToken,
            user.refreshToken
        );

        if (!isValid) {
            throw new ApiError(
                401,
                "Invalid refresh token."
            );
        }

        if (!user._id) {
            throw new ApiError(500, "User ID is missing.");
        }

        const tokens = this.generateTokens(user);

        const hashedRefreshToken = await hashPassword(
            tokens.refreshToken
        );

        await authRepository.updateRefreshToken(
            user._id,
            hashedRefreshToken
        );

        return tokens;
    }

    async logout(userId: Types.ObjectId): Promise<void> {
        const user = await authRepository.findUserById(userId);

        if (!user) {
            throw new ApiError(
                404,
                "User not found."
            );
        }

        await authRepository.updateRefreshToken(
            userId,
            null
        );
    }

    async getProfile(
        userId: Types.ObjectId
    ): Promise<Partial<SanitizedUser>> {
        const user = await authRepository.findUserById(userId);

        if (!user) {
            throw new ApiError(
                404,
                "User not found."
            );
        }

        return this.sanitizeUser(user);
    }
}

export const authService = new AuthService();

export default authService;
