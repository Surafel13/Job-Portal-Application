import type { Types } from "mongoose";
import UserRepository from "../user/user.repository.js";
import type { IUser } from "../user/user.interface.js";

export class AuthRepository {
    constructor(
        private readonly userRepository: UserRepository
    ) {}

    async createUser(data: IUser): Promise<IUser> {
        return this.userRepository.create(data);
    }

    async findUserByEmail(email: string): Promise<IUser | null> {
        return this.userRepository.findByEmail(email);
    }

    async findUserByEmailWithPassword(
        email: string
    ): Promise<IUser | null> {
        return this.userRepository.findByEmailWithPassword(email);
    }

    async findUserById(
        userId: Types.ObjectId
    ): Promise<IUser | null> {
        return this.userRepository.findById(userId);
    }

    async findUserByIdWithRefreshToken(
        userId: Types.ObjectId
    ): Promise<IUser | null> {
        return this.userRepository.findByIdWithRefreshToken(userId);
    }

    async updateRefreshToken(
        userId: Types.ObjectId,
        refreshToken: string | null
    ): Promise<IUser | null> {
        return this.userRepository.updateRefreshToken(
            userId,
            refreshToken
        );
    }

    async existsByEmail(email: string): Promise<boolean> {
        return this.userRepository.existsByEmail(email);
    }
}

export const authRepository = new AuthRepository(
    new UserRepository()
);

export default authRepository;