import test from "node:test";
import assert from "node:assert/strict";
import { Types } from "mongoose";
import {
    createConversationSchema,
    sendMessageSchema,
    conversationQuerySchema,
    messageQuerySchema,
    conversationIdParamSchema,
} from "./conversation.validation.js";
import { escapeRegex } from "./conversation.repository.js";
import { ConversationService } from "./conversation.service.js";
import { ApiError } from "../../utils/ApiError.js";
import type { IConversation } from "./conversation.interface.js";

test("Conversation Validation: createConversationSchema", () => {
    const validObjectId1 = new Types.ObjectId().toString();
    const validObjectId2 = new Types.ObjectId().toString();

    // Valid with recipientId
    const res1 = createConversationSchema.safeParse({
        recipientId: validObjectId1,
    });
    assert.equal(res1.success, true);

    // Valid with jobId and initialMessage
    const res2 = createConversationSchema.safeParse({
        jobId: validObjectId2,
        initialMessage: "Hello, I am interested in this role.",
    });
    assert.equal(res2.success, true);

    // Invalid when none of recipientId, jobId, applicationId provided
    const res3 = createConversationSchema.safeParse({});
    assert.equal(res3.success, false);

    // Invalid objectId format
    const res4 = createConversationSchema.safeParse({
        recipientId: "invalid-id-123",
    });
    assert.equal(res4.success, false);
});

test("Conversation Validation: sendMessageSchema", () => {
    // Valid message
    const res1 = sendMessageSchema.safeParse({
        content: "Hello there!",
    });
    assert.equal(res1.success, true);
    if (res1.success) {
        assert.equal(res1.data.content, "Hello there!");
    }

    // Invalid: empty content
    const res2 = sendMessageSchema.safeParse({
        content: "   ",
    });
    assert.equal(res2.success, false);

    // Invalid: content exceeds 5000 characters
    const res3 = sendMessageSchema.safeParse({
        content: "a".repeat(5001),
    });
    assert.equal(res3.success, false);
});

test("Conversation Validation: pagination queries", () => {
    // conversationQuerySchema defaults
    const q1 = conversationQuerySchema.parse({});
    assert.equal(q1.page, 1);
    assert.equal(q1.limit, 20);

    // messageQuerySchema defaults
    const q2 = messageQuerySchema.parse({});
    assert.equal(q2.page, 1);
    assert.equal(q2.limit, 30);

    // conversationIdParamSchema
    const validId = new Types.ObjectId().toString();
    const paramRes = conversationIdParamSchema.safeParse({
        conversationId: validId,
    });
    assert.equal(paramRes.success, true);

    const invalidParamRes = conversationIdParamSchema.safeParse({
        conversationId: "not-an-oid",
    });
    assert.equal(invalidParamRes.success, false);

    const searchQuery = conversationQuerySchema.parse({ search: "  Ada  ", page: "2" });
    assert.equal(searchQuery.search, "Ada");
    assert.equal(searchQuery.page, 2);
});

test("Conversation search: escapeRegex prevents ReDoS/injection metacharacters", () => {
    assert.equal(escapeRegex("Ada.*"), "Ada\\.\\*");
    assert.equal(escapeRegex("job (remote)"), "job \\(remote\\)");
});

test("Conversation Service: Participant Authorization Security Check", () => {
    const service = new ConversationService();
    const userA = new Types.ObjectId().toString();
    const userB = new Types.ObjectId().toString();
    const unauthorizedUser = new Types.ObjectId().toString();

    const conversation: IConversation = {
        _id: new Types.ObjectId(),
        participants: [new Types.ObjectId(userA), new Types.ObjectId(userB)],
        unreadCounts: new Map(),
    };

    // Private method verifyUserParticipation test via reflection
    const verifyParticipation = (service as any).verifyUserParticipation.bind(service);

    // Participant userA should not throw
    assert.doesNotThrow(() => {
        verifyParticipation(conversation, userA);
    });

    // Participant userB should not throw
    assert.doesNotThrow(() => {
        verifyParticipation(conversation, userB);
    });

    // Unauthorized user should throw 403 ApiError
    assert.throws(
        () => {
            verifyParticipation(conversation, unauthorizedUser);
        },
        (err: any) => {
            return (
                err instanceof ApiError &&
                err.statusCode === 403 &&
                err.message === "You do not have permission to access this conversation."
            );
        }
    );
});
