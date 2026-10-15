import { Types } from "mongoose";
import MessageModel from "./message.model.js";
import type { IMessage } from "./conversation.interface.js";

export class MessageRepository {
    async create(data: Partial<IMessage>): Promise<IMessage> {
        const message = await MessageModel.create(data);
        return message.toObject();
    }

    async findById(messageId: Types.ObjectId): Promise<IMessage | null> {
        return MessageModel.findById(messageId).lean().exec();
    }

    async findByIdWithDetails(messageId: Types.ObjectId): Promise<IMessage | null> {
        return MessageModel.findById(messageId)
            .populate("senderId", "fullName email role profileImage")
            .populate("recipientId", "fullName email role profileImage")
            .lean()
            .exec();
    }

    async findByConversation(
        conversationId: Types.ObjectId,
        options: { skip: number; limit: number; before?: Date }
    ): Promise<{ messages: IMessage[]; total: number }> {
        const query: Record<string, unknown> = { conversationId };

        if (options.before) {
            query.createdAt = { $lt: options.before };
        }

        const [total, messages] = await Promise.all([
            MessageModel.countDocuments({ conversationId }),
            MessageModel.find(query)
                .sort({ createdAt: -1 })
                .skip(options.skip)
                .limit(options.limit)
                .populate("senderId", "fullName email role profileImage")
                .populate("recipientId", "fullName email role profileImage")
                .lean()
                .exec(),
        ]);

        return {
            messages: messages.reverse(),
            total,
        };
    }

    async markMessagesAsRead(
        conversationId: Types.ObjectId,
        recipientId: Types.ObjectId
    ): Promise<number> {
        const now = new Date();
        const result = await MessageModel.updateMany(
            {
                conversationId,
                recipientId,
                read: false,
            },
            {
                $set: {
                    read: true,
                    readAt: now,
                },
            }
        ).exec();

        return result.modifiedCount;
    }

    async getUnreadCount(
        recipientId: Types.ObjectId,
        conversationId?: Types.ObjectId
    ): Promise<number> {
        const query: Record<string, unknown> = {
            recipientId,
            read: false,
        };

        if (conversationId) {
            query.conversationId = conversationId;
        }

        return MessageModel.countDocuments(query).exec();
    }
}

export const messageRepository = new MessageRepository();
export default messageRepository;
