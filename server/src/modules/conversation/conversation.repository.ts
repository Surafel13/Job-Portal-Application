import { Types } from "mongoose";
import ConversationModel from "./conversation.model.js";
import type { IConversation, IConversationLastMessage } from "./conversation.interface.js";

export function escapeRegex(value: string): string {
    return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

const PARTICIPANT_FIELDS = "fullName email role profileImage status location";
const JOB_FIELDS = "title location employmentType companyId";

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
            .populate("participants", PARTICIPANT_FIELDS)
            .populate("jobId", JOB_FIELDS)
            .lean()
            .exec();
    }

    async findByParticipants(
        userA: Types.ObjectId,
        userB: Types.ObjectId,
        jobId?: Types.ObjectId
    ): Promise<IConversation | null> {
        const query: Record<string, unknown> = {
            participants: { $all: [userA, userB], $size: 2 },
        };

        if (jobId) {
            query.jobId = jobId;
        }

        return ConversationModel.findOne(query)
            .sort({ lastMessageAt: -1 })
            .populate("participants", PARTICIPANT_FIELDS)
            .populate("jobId", JOB_FIELDS)
            .lean()
            .exec();
    }

    async findByUser(
        userId: Types.ObjectId,
        options: { skip: number; limit: number; search?: string }
    ): Promise<{ conversations: IConversation[]; total: number }> {
        const search = options.search?.trim();

        if (!search) {
            const baseQuery: Record<string, unknown> = {
                participants: userId,
            };

            const [total, conversations] = await Promise.all([
                ConversationModel.countDocuments(baseQuery),
                ConversationModel.find(baseQuery)
                    .sort({ lastMessageAt: -1 })
                    .skip(options.skip)
                    .limit(options.limit)
                    .populate("participants", PARTICIPANT_FIELDS)
                    .populate("jobId", JOB_FIELDS)
                    .lean()
                    .exec(),
            ]);

            return { conversations, total };
        }

        const regex = new RegExp(escapeRegex(search), "i");

        const [result] = await ConversationModel.aggregate<{
            items: IConversation[];
            total: Array<{ count: number }>;
        }>([
            { $match: { participants: userId } },
            {
                $lookup: {
                    from: "users",
                    localField: "participants",
                    foreignField: "_id",
                    pipeline: [
                        {
                            $project: {
                                fullName: 1,
                                email: 1,
                                role: 1,
                                profileImage: 1,
                                status: 1,
                                location: 1,
                            },
                        },
                    ],
                    as: "participants",
                },
            },
            {
                $lookup: {
                    from: "jobs",
                    localField: "jobId",
                    foreignField: "_id",
                    pipeline: [
                        {
                            $project: {
                                title: 1,
                                location: 1,
                                employmentType: 1,
                                companyId: 1,
                            },
                        },
                    ],
                    as: "jobDocs",
                },
            },
            {
                $addFields: {
                    jobId: { $arrayElemAt: ["$jobDocs", 0] },
                    otherParticipants: {
                        $filter: {
                            input: "$participants",
                            as: "p",
                            cond: { $ne: ["$$p._id", userId] },
                        },
                    },
                },
            },
            {
                $match: {
                    $or: [
                        { "otherParticipants.fullName": regex },
                        { "otherParticipants.email": regex },
                        { "jobId.title": regex },
                        { "lastMessage.text": regex },
                    ],
                },
            },
            { $sort: { lastMessageAt: -1 } },
            {
                $facet: {
                    items: [
                        { $skip: options.skip },
                        { $limit: options.limit },
                        { $unset: ["jobDocs", "otherParticipants"] },
                    ],
                    total: [{ $count: "count" }],
                },
            },
        ]);

        return {
            conversations: result?.items ?? [],
            total: result?.total?.[0]?.count ?? 0,
        };
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
