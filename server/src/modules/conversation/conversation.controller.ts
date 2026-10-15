import type { Request, Response } from "express";
import asyncHandler from "../../utils/asyncHandler.js";
import sendResponse from "../../utils/sendResponse.js";
import { ApiError } from "../../utils/ApiError.js";
import conversationService from "./conversation.service.js";

export class ConversationController {
    createConversation = asyncHandler(async (req: Request, res: Response) => {
        if (!req.user?.userId) {
            throw new ApiError(401, "Authentication required.");
        }

        const conversation = await conversationService.getOrCreateConversation(
            req.user.userId,
            req.body
        );

        sendResponse(res, 201, "Conversation initialized successfully.", conversation);
    });

    getMyConversations = asyncHandler(async (req: Request, res: Response) => {
        if (!req.user?.userId) {
            throw new ApiError(401, "Authentication required.");
        }

        const { conversations, meta } = await conversationService.getUserConversations(
            req.user.userId,
            req.query as any
        );

        sendResponse(res, 200, "Conversations retrieved successfully.", conversations, meta);
    });

    getConversationById = asyncHandler(async (req: Request, res: Response) => {
        if (!req.user?.userId) {
            throw new ApiError(401, "Authentication required.");
        }

        const conversation = await conversationService.getConversationById(
            req.user.userId,
            req.params.conversationId as string
        );

        sendResponse(res, 200, "Conversation retrieved successfully.", conversation);
    });

    getConversationMessages = asyncHandler(async (req: Request, res: Response) => {
        if (!req.user?.userId) {
            throw new ApiError(401, "Authentication required.");
        }

        const { messages, meta } = await conversationService.getConversationMessages(
            req.user.userId,
            req.params.conversationId as string,
            req.query as any
        );

        sendResponse(res, 200, "Messages retrieved successfully.", messages, meta);
    });

    sendMessage = asyncHandler(async (req: Request, res: Response) => {
        if (!req.user?.userId) {
            throw new ApiError(401, "Authentication required.");
        }

        const message = await conversationService.sendMessage(
            req.user.userId,
            req.params.conversationId as string,
            req.body.content
        );

        sendResponse(res, 201, "Message sent successfully.", message);
    });

    markAsRead = asyncHandler(async (req: Request, res: Response) => {
        if (!req.user?.userId) {
            throw new ApiError(401, "Authentication required.");
        }

        const result = await conversationService.markConversationAsRead(
            req.user.userId,
            req.params.conversationId as string
        );

        sendResponse(res, 200, "Messages marked as read.", result);
    });

    getTotalUnreadCount = asyncHandler(async (req: Request, res: Response) => {
        if (!req.user?.userId) {
            throw new ApiError(401, "Authentication required.");
        }

        const totalUnread = await conversationService.getTotalUnreadCount(req.user.userId);

        sendResponse(res, 200, "Unread count retrieved successfully.", { totalUnread });
    });

    getAvailableContacts = asyncHandler(async (req: Request, res: Response) => {
        if (!req.user?.userId) {
            throw new ApiError(401, "Authentication required.");
        }

        const contacts = await conversationService.getAvailableContacts(
            req.user.userId,
            req.user.role
        );

        sendResponse(res, 200, "Available contacts retrieved successfully.", contacts);
    });
}

export const conversationController = new ConversationController();
export default conversationController;
