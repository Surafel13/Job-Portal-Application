import { Schema, model } from "mongoose";
import type { IConversation } from "./conversation.interface.js";

const conversationSchema = new Schema<IConversation>(
    {
        participants: [
            {
                type: Schema.Types.ObjectId,
                ref: "User",
                required: true,
            },
        ],
        jobId: {
            type: Schema.Types.ObjectId,
            ref: "Job",
            required: false,
        },
        applicationId: {
            type: Schema.Types.ObjectId,
            ref: "Application",
            required: false,
        },
        lastMessage: {
            text: { type: String, trim: true },
            senderId: { type: Schema.Types.ObjectId, ref: "User" },
            createdAt: { type: Date, default: Date.now },
        },
        lastMessageAt: {
            type: Date,
            default: Date.now,
            index: true,
        },
        unreadCounts: {
            type: Map,
            of: Number,
            default: () => new Map(),
        },
    },
    {
        timestamps: true,
    }
);

conversationSchema.index({ participants: 1 });
conversationSchema.index({ participants: 1, lastMessageAt: -1 });
conversationSchema.index({ participants: 1, jobId: 1 });

export const ConversationModel = model<IConversation>("Conversation", conversationSchema);
export default ConversationModel;
