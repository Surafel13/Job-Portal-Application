import type { Types } from "mongoose";
import UserModel from "./user.model.js";
import type { IUser, UserRole } from "./user.interface.js";

export class UserRepository {
    async create(data: IUser): Promise<IUser> {
        const user = await UserModel.create(data);
        return user.toObject();
    }

    async findById(userId: Types.ObjectId): Promise<IUser | null> {
        return UserModel.findById(userId)
            .lean<IUser>()
            .exec();
    }

    async findByEmail(email: string): Promise<IUser | null> {
        return UserModel.findOne({
            email: email.toLowerCase().trim(),
        })
            .lean<IUser>()
            .exec();
    }

    async findByEmailWithPassword(
        email: string
    ): Promise<IUser | null> {
        return UserModel.findOne({
            email: email.toLowerCase().trim(),
        })
            .select("+password")
            .lean<IUser>()
            .exec();
    }

    async findByEmailWithRefreshToken(
        email: string
    ): Promise<IUser | null> {
        return UserModel.findOne({
            email: email.toLowerCase().trim(),
        })
            .select("+refreshToken")
            .lean<IUser>()
            .exec();
    }

    async findByIdWithRefreshToken(
        userId: Types.ObjectId
    ): Promise<IUser | null> {
        return UserModel.findById(userId)
            .select("+refreshToken")
            .lean<IUser>()
            .exec();
    }

    async findByRole(role: UserRole): Promise<IUser[]> {
        return UserModel.find({ role })
            .sort({ createdAt: -1 })
            .lean<IUser[]>()
            .exec();
    }

    async updateById(
        userId: Types.ObjectId,
        data: Partial<IUser>
    ): Promise<IUser | null> {
        return UserModel.findByIdAndUpdate(
            userId,
            { $set: data },
            {
                new: true,
                runValidators: true,
            }
        )
            .lean<IUser>()
            .exec();
    }

    async updateRefreshToken(
        userId: Types.ObjectId,
        refreshToken: string | null
    ): Promise<IUser | null> {
        return UserModel.findByIdAndUpdate(
            userId,
            { $set: { refreshToken } },
            {
                new: true,
                runValidators: true,
            }
        )
            .lean<IUser>()
            .exec();
    }

    async deleteById(userId: Types.ObjectId): Promise<boolean> {
        const result = await UserModel.deleteOne({
            _id: userId,
        }).exec();

        return result.deletedCount === 1;
    }

    async existsByEmail(email: string): Promise<boolean> {
        const user = await UserModel.exists({
            email: email.toLowerCase().trim(),
        });

        return user !== null;
    }
}

export default UserRepository;