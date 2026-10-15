import { Types } from "mongoose";
import { ApiError } from "../../utils/ApiError.js";
import { getPagination } from "../../utils/pagination.js";
import conversationRepository from "./conversation.repository.js";
import messageRepository from "./message.repository.js";
import UserModel from "../user/user.model.js";
import JobModel from "../job/job.model.js";
import ApplicationModel from "../application/application.model.js";
import Company from "../employer/employer.model.js";
import ApplicantModel from "../applicant/applicant.model.js";
import {
    emitNewMessage,
    emitMessagesRead,
    emitConversationUpdated,
} from "../../socket/socket.server.js";
import type {
    IConversation,
    IMessage,
    IConversationContact,
} from "./conversation.interface.js";

export class ConversationService {
    private validateObjectId(id: string, fieldName = "ID"): Types.ObjectId {
        if (!id || !Types.ObjectId.isValid(id)) {
            throw new ApiError(400, `Invalid ${fieldName}.`);
        }
        return new Types.ObjectId(id);
    }

    private verifyUserParticipation(
        conversation: IConversation,
        userId: string
    ): void {
        const isParticipant = conversation.participants.some((p: any) => {
            const participantId = p._id ? p._id.toString() : p.toString();
            return participantId === userId;
        });

        if (!isParticipant) {
            throw new ApiError(
                403,
                "You do not have permission to access this conversation."
            );
        }
    }

    async getOrCreateConversation(
        currentUserId: string,
        data: {
            recipientId?: string;
            jobId?: string;
            applicationId?: string;
            initialMessage?: string;
        }
    ): Promise<IConversation> {
        let recipientUserId = data.recipientId;
        let resolvedJobId = data.jobId;

        // If jobId is provided but no recipientId, find the employer recruiter
        if (!recipientUserId && resolvedJobId) {
            const jobOid = this.validateObjectId(resolvedJobId, "job ID");
            const job = await JobModel.findById(jobOid).lean();
            if (!job) {
                throw new ApiError(404, "Job not found.");
            }

            const company = await Company.findById(job.companyId).lean();
            if (!company || !company.recruiters || company.recruiters.length === 0) {
                throw new ApiError(404, "Employer recruiter not found for this job.");
            }

            recipientUserId = company.recruiters[0].toString();
        }

        // If applicationId is provided but no recipientId, resolve applicant or employer
        if (!recipientUserId && data.applicationId) {
            const appOid = this.validateObjectId(data.applicationId, "application ID");
            const application = await ApplicationModel.findById(appOid)
                .populate<{ applicantId: { userId: Types.ObjectId } }>("applicantId")
                .populate<{ jobId: { companyId: Types.ObjectId } }>("jobId")
                .lean();

            if (!application) {
                throw new ApiError(404, "Application not found.");
            }

            const applicantUserId = application.applicantId?.userId?.toString();
            if (applicantUserId && applicantUserId !== currentUserId) {
                recipientUserId = applicantUserId;
            } else {
                const company = await Company.findById(application.jobId?.companyId).lean();
                if (company && company.recruiters && company.recruiters.length > 0) {
                    recipientUserId = company.recruiters[0].toString();
                }
            }
            if (!resolvedJobId && application.jobId) {
                resolvedJobId = (application.jobId as any)._id?.toString() || application.jobId.toString();
            }
        }

        if (!recipientUserId) {
            throw new ApiError(400, "Recipient user ID is required.");
        }

        if (recipientUserId === currentUserId) {
            throw new ApiError(400, "Cannot start a conversation with yourself.");
        }

        const userOid = this.validateObjectId(currentUserId, "user ID");
        const recipientOid = this.validateObjectId(recipientUserId, "recipient ID");

        // Verify recipient user exists and is active
        const recipientUser = await UserModel.findById(recipientOid).lean();
        if (!recipientUser) {
            throw new ApiError(404, "Recipient user not found.");
        }
        if (recipientUser.status === "deactivated") {
            throw new ApiError(400, "Recipient user account is deactivated.");
        }

        const jobOid = resolvedJobId
            ? this.validateObjectId(resolvedJobId, "job ID")
            : undefined;

        // Check if conversation already exists
        let conversation = await conversationRepository.findByParticipants(
            userOid,
            recipientOid,
            jobOid
        );

        if (!conversation && !jobOid) {
            // Also check without jobId if general conversation exists
            conversation = await conversationRepository.findByParticipants(
                userOid,
                recipientOid
            );
        }

        if (!conversation) {
            const created = await conversationRepository.create({
                participants: [userOid, recipientOid],
                jobId: jobOid,
                applicationId: data.applicationId
                    ? this.validateObjectId(data.applicationId, "application ID")
                    : undefined,
                unreadCounts: new Map<string, number>([
                    [currentUserId, 0],
                    [recipientUserId, 0],
                ]),
                lastMessageAt: new Date(),
            });

            conversation = await conversationRepository.findByIdWithDetails(
                created._id as Types.ObjectId
            );
        }

        if (!conversation) {
            throw new ApiError(500, "Failed to initialize conversation.");
        }

        // If an initial message was supplied, send it
        if (data.initialMessage && data.initialMessage.trim().length > 0) {
            await this.sendMessage(
                currentUserId,
                (conversation._id as Types.ObjectId).toString(),
                data.initialMessage
            );
            conversation = await conversationRepository.findByIdWithDetails(
                conversation._id as Types.ObjectId
            );
        }

        return conversation!;
    }

    async getUserConversations(
        currentUserId: string,
        options: { page?: number; limit?: number; search?: string }
    ): Promise<{ conversations: any[]; meta: any }> {
        const userOid = this.validateObjectId(currentUserId, "user ID");
        const limit = Math.min(50, Math.max(1, Number(options.limit) || 20));
        const page = Math.max(1, Number(options.page) || 1);
        const skip = (page - 1) * limit;

        const { conversations, total } = await conversationRepository.findByUser(
            userOid,
            { skip, limit, search: options.search }
        );

        const pagination = getPagination({ page, limit }, total);

        // Format conversations for the client
        const formatted = conversations.map((conv: any) => {
            const unreadCountsObj =
                conv.unreadCounts instanceof Map
                    ? Object.fromEntries(conv.unreadCounts)
                    : conv.unreadCounts || {};

            const otherParticipant = conv.participants?.find(
                (p: any) => (p._id ? p._id.toString() : p.toString()) !== currentUserId
            );

            return {
                ...conv,
                unreadCount: unreadCountsObj[currentUserId] || 0,
                otherParticipant: otherParticipant || null,
            };
        });

        // Filter by search in-memory if search parameter is provided
        let resultList = formatted;
        if (options.search && options.search.trim().length > 0) {
            const query = options.search.toLowerCase().trim();
            resultList = formatted.filter((c: any) => {
                const name = c.otherParticipant?.fullName?.toLowerCase() || "";
                const jobTitle = (c.jobId as any)?.title?.toLowerCase() || "";
                return name.includes(query) || jobTitle.includes(query);
            });
        }

        return {
            conversations: resultList,
            meta: pagination,
        };
    }

    async getConversationById(
        currentUserId: string,
        conversationId: string
    ): Promise<any> {
        const convOid = this.validateObjectId(conversationId, "conversation ID");
        const conversation = await conversationRepository.findByIdWithDetails(convOid);

        if (!conversation) {
            throw new ApiError(404, "Conversation not found.");
        }

        this.verifyUserParticipation(conversation, currentUserId);

        const unreadCountsObj =
            conversation.unreadCounts instanceof Map
                ? Object.fromEntries(conversation.unreadCounts)
                : conversation.unreadCounts || {};

        const otherParticipant = (conversation.participants as any[])?.find(
            (p: any) => (p._id ? p._id.toString() : p.toString()) !== currentUserId
        );

        return {
            ...conversation,
            unreadCount: unreadCountsObj[currentUserId] || 0,
            otherParticipant: otherParticipant || null,
        };
    }

    async getConversationMessages(
        currentUserId: string,
        conversationId: string,
        options: { page?: number; limit?: number; before?: string }
    ): Promise<{ messages: IMessage[]; meta: any }> {
        const convOid = this.validateObjectId(conversationId, "conversation ID");
        const conversation = await conversationRepository.findById(convOid);

        if (!conversation) {
            throw new ApiError(404, "Conversation not found.");
        }

        this.verifyUserParticipation(conversation, currentUserId);

        const limit = Math.min(100, Math.max(1, Number(options.limit) || 30));
        const page = Math.max(1, Number(options.page) || 1);
        const skip = (page - 1) * limit;

        const beforeDate = options.before ? new Date(options.before) : undefined;

        const { messages, total } = await messageRepository.findByConversation(
            convOid,
            { skip, limit, before: beforeDate }
        );

        const pagination = getPagination({ page, limit }, total);

        return {
            messages,
            meta: pagination,
        };
    }

    async sendMessage(
        currentUserId: string,
        conversationId: string,
        content: string
    ): Promise<IMessage> {
        const convOid = this.validateObjectId(conversationId, "conversation ID");
        const userOid = this.validateObjectId(currentUserId, "user ID");

        const conversation = await conversationRepository.findById(convOid);
        if (!conversation) {
            throw new ApiError(404, "Conversation not found.");
        }

        this.verifyUserParticipation(conversation, currentUserId);

        const trimmedContent = content?.trim();
        if (!trimmedContent) {
            throw new ApiError(400, "Message content cannot be empty.");
        }
        if (trimmedContent.length > 5000) {
            throw new ApiError(400, "Message content cannot exceed 5000 characters.");
        }

        // Determine recipient
        const recipientParticipant = conversation.participants.find(
            (p: any) => (p._id ? p._id.toString() : p.toString()) !== currentUserId
        );

        if (!recipientParticipant) {
            throw new ApiError(400, "Recipient not found in conversation.");
        }

        const recipientIdStr = recipientParticipant._id
            ? recipientParticipant._id.toString()
            : recipientParticipant.toString();
        const recipientOid = new Types.ObjectId(recipientIdStr);

        const message = await messageRepository.create({
            conversationId: convOid,
            senderId: userOid,
            recipientId: recipientOid,
            content: trimmedContent,
            read: false,
        });

        const detailedMessage = await messageRepository.findByIdWithDetails(
            message._id as Types.ObjectId
        );

        const lastMessageData = {
            text: trimmedContent,
            senderId: userOid,
            createdAt: new Date(),
        };

        // Update conversation summary & unread counts
        await conversationRepository.updateLastMessage(
            convOid,
            lastMessageData,
            recipientOid
        );

        const updatedConversation = await conversationRepository.findByIdWithDetails(convOid);

        // Real-time broadcast via Socket.IO
        emitNewMessage(conversationId, detailedMessage || message, recipientIdStr);
        if (updatedConversation) {
            emitConversationUpdated(recipientIdStr, updatedConversation);
        }

        return (detailedMessage || message) as IMessage;
    }

    async markConversationAsRead(
        currentUserId: string,
        conversationId: string
    ): Promise<{ modifiedCount: number; readAt: Date }> {
        const convOid = this.validateObjectId(conversationId, "conversation ID");
        const userOid = this.validateObjectId(currentUserId, "user ID");

        const conversation = await conversationRepository.findById(convOid);
        if (!conversation) {
            throw new ApiError(404, "Conversation not found.");
        }

        this.verifyUserParticipation(conversation, currentUserId);

        const modifiedCount = await messageRepository.markMessagesAsRead(
            convOid,
            userOid
        );

        await conversationRepository.resetUnreadCount(convOid, userOid);

        const now = new Date();
        emitMessagesRead(conversationId, currentUserId, now);

        return { modifiedCount, readAt: now };
    }

    async getTotalUnreadCount(currentUserId: string): Promise<number> {
        const userOid = this.validateObjectId(currentUserId, "user ID");
        return messageRepository.getUnreadCount(userOid);
    }

    async getAvailableContacts(
        currentUserId: string,
        currentUserRole: string
    ): Promise<IConversationContact[]> {
        const contacts: IConversationContact[] = [];
        const seenUserIds = new Set<string>([currentUserId]);

        if (currentUserRole === "worker") {
            // Find applicant record
            const applicant = await ApplicantModel.findOne({
                userId: new Types.ObjectId(currentUserId),
            }).lean();

            if (applicant) {
                // Find all jobs the worker applied to
                const applications = await ApplicationModel.find({
                    applicantId: applicant._id,
                })
                    .populate<{ jobId: { _id: Types.ObjectId; title: string; companyId: Types.ObjectId } }>("jobId")
                    .lean();

                for (const app of applications) {
                    if (app.jobId && app.jobId.companyId) {
                        const company = await Company.findById(app.jobId.companyId)
                            .populate<{ recruiters: any[] }>("recruiters", "fullName email role profileImage")
                            .lean();

                        if (company?.recruiters) {
                            for (const rec of company.recruiters) {
                                const recId = rec._id?.toString();
                                if (recId && !seenUserIds.has(recId)) {
                                    seenUserIds.add(recId);
                                    contacts.push({
                                        userId: recId,
                                        fullName: rec.fullName,
                                        email: rec.email,
                                        role: "employer",
                                        profileImage: rec.profileImage,
                                        context: `${company.name} • ${app.jobId.title}`,
                                        jobId: app.jobId._id.toString(),
                                        applicationId: (app._id as Types.ObjectId).toString(),
                                    });
                                }
                            }
                        }
                    }
                }
            }

            // Also find companies with published jobs so worker can inquire
            const recentJobs = await JobModel.find({ status: "published" })
                .limit(10)
                .lean();

            for (const job of recentJobs) {
                const company = await Company.findById(job.companyId)
                    .populate<{ recruiters: any[] }>("recruiters", "fullName email role profileImage")
                    .lean();

                if (company?.recruiters) {
                    for (const rec of company.recruiters) {
                        const recId = rec._id?.toString();
                        if (recId && !seenUserIds.has(recId)) {
                            seenUserIds.add(recId);
                            contacts.push({
                                userId: recId,
                                fullName: rec.fullName,
                                email: rec.email,
                                role: "employer",
                                profileImage: rec.profileImage,
                                context: `${company.name} • ${job.title}`,
                                jobId: (job._id as Types.ObjectId).toString(),
                            });
                        }
                    }
                }
            }
        } else if (currentUserRole === "employer") {
            // Find employer record where current user is recruiter
            const company = await Company.findOne({
                recruiters: new Types.ObjectId(currentUserId),
            }).lean();

            if (company) {
                // Find all jobs posted by this company
                const jobs = await JobModel.find({ companyId: company._id }).select("_id title").lean();
                const jobIds = jobs.map((j) => j._id);

                // Find applications for these jobs
                const applications = await ApplicationModel.find({ jobId: { $in: jobIds } })
                    .populate<{ applicantId: { userId: Types.ObjectId } }>("applicantId")
                    .populate<{ jobId: { title: string } }>("jobId")
                    .lean();

                for (const app of applications) {
                    const applicantUserId = app.applicantId?.userId?.toString();
                    if (applicantUserId && !seenUserIds.has(applicantUserId)) {
                        seenUserIds.add(applicantUserId);
                        const user = await UserModel.findById(applicantUserId)
                            .select("fullName email role profileImage")
                            .lean();

                        if (user) {
                            contacts.push({
                                userId: applicantUserId,
                                fullName: user.fullName,
                                email: user.email,
                                role: "worker",
                                profileImage: user.profileImage,
                                context: `Applied for: ${app.jobId?.title || "Job"}`,
                                jobId: (app.jobId as any)?._id?.toString(),
                                applicationId: (app._id as Types.ObjectId).toString(),
                            });
                        }
                    }
                }
            }

            // Also list active workers if no applications yet
            if (contacts.length === 0) {
                const workers = await UserModel.find({ role: "worker", status: "active" })
                    .limit(10)
                    .select("fullName email role profileImage")
                    .lean();

                for (const w of workers) {
                    const wId = (w._id as Types.ObjectId).toString();
                    if (!seenUserIds.has(wId)) {
                        seenUserIds.add(wId);
                        contacts.push({
                            userId: wId,
                            fullName: w.fullName,
                            email: w.email,
                            role: "worker",
                            profileImage: w.profileImage,
                            context: "Candidate",
                        });
                    }
                }
            }
        }

        return contacts;
    }
}

export const conversationService = new ConversationService();
export default conversationService;
