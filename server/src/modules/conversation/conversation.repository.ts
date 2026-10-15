import { Types } from "mongoose";
import ConversationModel from "./conversation.model.js";
import type { IConversation, IConversationLastMessage } from "./conversation.interface.js";

export class ConversationRepository {
    async create(data: Partial<IConversation>): Promise<IConversation> {
        const conversation = await ConversationModel.create(data);
        return conversation.toObject();
    }

    async findById(conversationId: Types.ObjectId): Promise<IConversation | null> {
        return ConversationModel.findById(conversationId).lean().exec();
    }

    async findByIdWithDetails(conversationId: Types.ObjectId): Promise<IConversation | null> {
        return ConversationModel.findById(conversationId)
            .populate("participants", "fullName email role profileImage status location")
            .populate("jobId", "title location employmentType companyId")
            .lean()
            .exec();
    }

    async findByParticipants(
        userA: Types.ObjectId,
        userB: Types.ObjectId,
        jobId?: Types.ObjectId
    ): Promise<IConversation | null> {
        const query: Record<string, unknown> = {
            participants: { $all: [userA, userB] },
        };

        if (jobId) {
            query.jobId = jobId;
        }

        return ConversationModel.findOne(query)
            .populate("participants", "fullName email role profileImage status location")
            .populate("jobId", "title location employmentType companyId")
            .lean()
            .exec();
    }

    async findByUser(
        userId: Types.ObjectId,
        options: { skip: number; limit: number; search?: string }
    ): Promise<{ conversations: IConversation[]; total: number }> {
        const baseQuery: Record<string, unknown> = {
            participants: userId,
        };

        const [total, conversations] = await Promise.all([
            ConversationModel.countDocuments(baseQuery),
            ConversationModel.find(baseQuery)
                .sort({ lastMessageAt: -1 })
                .skip(options.skip)
                .limit(options.limit)
                .populate("participants", "fullName email role profileImage status location")
                .populate("jobId", "title location employmentType companyId")
                .lean()
                .exec(),
        ]);

        return { conversations, total };
    }

    async updateLastMessage(
        conversationId: Types.ObjectId,
        lastMessage: IConversationLastMessage,
        recipientId: Types.ObjectId
    ): Promise<void> {
        const recipientKey = `unreadCounts.${recipientId.toString()}`;
        await ConversationModel.findByIdAndUpdate(conversationId, {
            $set: {
                lastMessage,
                lastMessageAt: lastMessage.createdAt || new Date(),
            },
            $inc: {
                [recipientKey]: 1,
            },
        }).exec();
    }

    async resetUnreadCount(
        conversationId: Types.ObjectId,
        userId: Types.ObjectId
    ): Promise<void> {
        const userKey = `unreadCounts.${userId.toString()}`;
        await ConversationModel.findByIdAndUpdate(conversationId, {
            $set: {
                [userKey]: 0,
            },
        }).exec();
    }

    async delete(conversationId: Types.ObjectId): Promise<void> {
        await ConversationModel.findByIdAndDelete(conversationId).exec();
    }
}

export const conversationRepository = new ConversationRepository();
export default conversationRepository;
