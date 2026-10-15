import { Router } from "express";
import conversationController from "./conversation.controller.js";
import authMiddleware from "../../middlewares/auth.middleware.js";
import { messageRateLimitMiddleware } from "../../middlewares/rateLimit.middleware.js";
import {
    validateBody,
    validateParams,
    validateQuery,
} from "../../middlewares/validation.middleware.js";
import {
    conversationIdParamSchema,
    createConversationSchema,
    sendMessageSchema,
    conversationQuerySchema,
    messageQuerySchema,
} from "./conversation.validation.js";

const router = Router();

// All conversation routes require authentication
router.use(authMiddleware);

// Get my conversations (with pagination & search)
router.get(
    "/",
    validateQuery(conversationQuerySchema),
    conversationController.getMyConversations
);

// Start or retrieve a conversation
router.post(
    "/",
    messageRateLimitMiddleware,
    validateBody(createConversationSchema),
    conversationController.createConversation
);

// Get total unread count for badge indicator
router.get(
    "/unread/count",
    conversationController.getTotalUnreadCount
);

// Get available contacts (workers/employers from applications & listings)
router.get(
    "/contacts",
    conversationController.getAvailableContacts
);

// Get single conversation details
router.get(
    "/:conversationId",
    validateParams(conversationIdParamSchema),
    conversationController.getConversationById
);

// Get paginated messages for a conversation
router.get(
    "/:conversationId/messages",
    validateParams(conversationIdParamSchema),
    validateQuery(messageQuerySchema),
    conversationController.getConversationMessages
);

// Send message in a conversation
router.post(
    "/:conversationId/messages",
    messageRateLimitMiddleware,
    validateParams(conversationIdParamSchema),
    validateBody(sendMessageSchema),
    conversationController.sendMessage
);

// Mark conversation messages as read
router.patch(
    "/:conversationId/read",
    validateParams(conversationIdParamSchema),
    conversationController.markAsRead
);

export default router;
