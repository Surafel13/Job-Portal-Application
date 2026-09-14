import type { Types } from "mongoose";
import { ApiError } from "../../utils/ApiError.js";
import UserRepository from "./user.repository.js";
import type {
    IUser,
    UserRole,
    UserStatus,
} from "./user.interface.js";

export class UserService {
    constructor(
        private readonly userRepository: UserRepository
    ) {}

    async getUserById(userId: Types.ObjectId): Promise<IUser> {
        const user = await this.userRepository.findById(userId);

        if (!user) {
            throw new ApiError(404, "User not found.");
        }

        return user;
    }

    async getUserByEmail(email: string): Promise<IUser> {
        const user = await this.userRepository.findByEmail(
            email.toLowerCase().trim()
        );

        if (!user) {
            throw new ApiError(404, "User not found.");
        }

        return user;
    }

    async getUsersByRole(role: UserRole): Promise<IUser[]> {
        return this.userRepository.findByRole(role);
    }

    async updateUser(
        userId: Types.ObjectId,
        data: Partial<IUser>
    ): Promise<IUser> {
        const updateData = {
            ...data,
            ...(data.email
                ? { email: data.email.toLowerCase().trim() }
                : {}),
        };

        if (updateData.email) {
            const existingUser =
                await this.userRepository.findByEmail(updateData.email);

            if (
                existingUser &&
                existingUser._id &&
                existingUser._id.toString() !== userId.toString()
            ) {
                throw new ApiError(409, "Email is already registered.");
            }
        }

        const user = await this.userRepository.updateById(
            userId,
            updateData
        );

        if (!user) {
            throw new ApiError(404, "User not found.");
        }

        return user;
    }

    async updateUserStatus(
        userId: Types.ObjectId,
        status: UserStatus
    ): Promise<IUser> {
        const user = await this.userRepository.updateById(userId, {
            status,
        });

        if (!user) {
            throw new ApiError(404, "User not found.");
        }

        return user;
    }

    async updateLastLogin(userId: Types.ObjectId): Promise<void> {
        const user = await this.userRepository.updateById(userId, {
            lastLogin: new Date(),
        });

        if (!user) {
            throw new ApiError(404, "User not found.");
        }
    }

    async deleteUser(userId: Types.ObjectId): Promise<void> {
        const deleted = await this.userRepository.deleteById(userId);

        if (!deleted) {
            throw new ApiError(404, "User not found.");
        }
    }
}

export const userService = new UserService(
    new UserRepository()
);

export default userService;