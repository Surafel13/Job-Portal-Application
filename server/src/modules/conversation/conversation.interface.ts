import type { Types } from "mongoose";
import type { IUser } from "../user/user.interface.js";
import type { IJob } from "../job/job.interface.js";

export interface IConversationLastMessage {
    text: string;
    senderId: Types.ObjectId;
    createdAt: Date;
}

export interface IConversation {
    _id?: Types.ObjectId;
    participants: Types.ObjectId[] | IUser[];
    jobId?: Types.ObjectId | IJob;
    applicationId?: Types.ObjectId;
    lastMessage?: IConversationLastMessage;
    lastMessageAt?: Date;
    unreadCounts: Map<string, number> | Record<string, number>;
    createdAt?: Date;
    updatedAt?: Date;
}

export interface IMessage {
    _id?: Types.ObjectId;
    conversationId: Types.ObjectId;
    senderId: Types.ObjectId | IUser;
    recipientId: Types.ObjectId | IUser;
    content: string;
    read: boolean;
    readAt?: Date;
    createdAt?: Date;
    updatedAt?: Date;
}

export interface IConversationContact {
    userId: string;
    fullName: string;
    email: string;
    role: string;
    profileImage?: string;
    context?: string;
    jobId?: string;
    applicationId?: string;
}
