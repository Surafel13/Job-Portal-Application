import test from "node:test";
import assert from "node:assert/strict";
import { Types } from "mongoose";
import { ApplicationService } from "./application.service.js";
import { ApiError } from "../../utils/ApiError.js";
import type { IWorker } from "../worker/worker.interface.js";

const completeWorker = (userId: Types.ObjectId): IWorker => ({
    _id: new Types.ObjectId(),
    userId,
    professionalSummary: "Experienced engineer",
    skills: [{ skillId: new Types.ObjectId(), name: "TypeScript" }],
    categoryIds: [new Types.ObjectId()],
    education: [{ institution: "AAU", degree: "BSc" }],
    experience: [
        {
            company: "Acme",
            jobTitle: "Engineer",
            startDate: new Date("2020-01-01"),
            isCurrent: true,
        },
    ],
    location: "Addis Ababa",
    preferredJobTypes: ["full-time"],
    preferredLocations: ["Addis Ababa"],
    preferredWorkTypes: ["remote"],
    resumeIds: [new Types.ObjectId()],
    profileCompletion: 100,
});

const createService = (overrides: Record<string, unknown> = {}) => {
    const userId = new Types.ObjectId();
    const workerId = new Types.ObjectId();
    const resumeId = new Types.ObjectId();
    const applicantId = new Types.ObjectId();
    const jobId = new Types.ObjectId();
    const companyId = new Types.ObjectId();
    const workerProfile = completeWorker(userId);
    workerProfile._id = workerId;

    const applicationRepository = {
        create: async (data: unknown) => data,
        findByApplicantAndJob: async () => null,
        findByApplicantId: async () => [],
        findById: async () => null,
        findRawById: async () => null,
        findByJobId: async () => [],
        updateById: async (_id: string, data: unknown) => data,
        countByResumeId: async () => 0,
        ...((overrides.applicationRepository as object) ?? {}),
    };

    const applicantRepository = {
        findByUserId: async () => ({
            _id: applicantId,
            userId,
            resumeId,
            skills: [],
            status: "active",
        }),
        create: async (data: unknown) => data,
        ...((overrides.applicantRepository as object) ?? {}),
    };

    const resumeRepository = {
        findById: async () => ({
            _id: resumeId,
            userId,
            workerId,
        }),
        ...((overrides.resumeRepository as object) ?? {}),
    };

    const workerRepository = {
        findByUserId: async () => workerProfile,
        ...((overrides.workerRepository as object) ?? {}),
    };

    const employerRepository = {
        findById: async () => ({
            _id: companyId,
            recruiters: [userId],
        }),
        ...((overrides.employerRepository as object) ?? {}),
    };

    const jobs = {
        findById: async () => ({
            _id: jobId,
            companyId,
            status: "published",
        }),
        ...((overrides.jobs as object) ?? {}),
    };

    const service = new ApplicationService(
        applicationRepository as never,
        applicantRepository as never,
        resumeRepository as never,
        workerRepository as never,
        employerRepository as never,
        jobs as never
    );

    return { service, userId, resumeId, applicantId, jobId, companyId };
};

test("ApplicationService rejects workers below 80% profile completion", async () => {
    const { service, userId, jobId, resumeId } = createService({
        workerRepository: {
            findByUserId: async () => ({
                ...completeWorker(userId),
                professionalSummary: undefined,
                skills: [],
                education: [],
                resumeIds: [],
            }),
        },
    });

    await assert.rejects(
        () =>
            service.createApplication(userId.toString(), jobId.toString(), {
                resumeId: resumeId.toString(),
            }),
        (error: unknown) =>
            error instanceof ApiError &&
            error.statusCode === 403 &&
            error.message.includes("80%")
    );
});

test("ApplicationService prevents duplicate applications", async () => {
    const { service, userId, jobId, resumeId } = createService({
        applicationRepository: {
            findByApplicantAndJob: async () => ({ _id: new Types.ObjectId() }),
        },
    });

    await assert.rejects(
        () =>
            service.createApplication(userId.toString(), jobId.toString(), {
                resumeId: resumeId.toString(),
            }),
        (error: unknown) =>
            error instanceof ApiError && error.statusCode === 409
    );
});

test("ApplicationService rejects using another worker's resume", async () => {
    const { service, userId, jobId, resumeId } = createService({
        resumeRepository: {
            findById: async () => ({
                _id: resumeId,
                userId: new Types.ObjectId(),
            }),
        },
    });

    await assert.rejects(
        () =>
            service.createApplication(userId.toString(), jobId.toString(), {
                resumeId: resumeId.toString(),
            }),
        (error: unknown) =>
            error instanceof ApiError && error.statusCode === 403
    );
});

test("ApplicationService creates an application with resume and cover letter", async () => {
    const { service, userId, jobId, resumeId, applicantId } = createService();

    const application = await service.createApplication(
        userId.toString(),
        jobId.toString(),
        {
            resumeId: resumeId.toString(),
            coverLetter: "I am a strong fit.",
        }
    );

    assert.equal(application.coverLetter, "I am a strong fit.");
    assert.equal(application.status, "pending");
    assert.equal(application.applicantId.toString(), applicantId.toString());
    assert.equal(application.resumeId?.toString(), resumeId.toString());
});

test("ApplicationService preserves withdrawn applications instead of deleting them", async () => {
    const applicationId = new Types.ObjectId();
    const { service, userId, applicantId } = createService({
        applicationRepository: {
            findRawById: async () => ({
                _id: applicationId,
                applicantId,
                status: "pending",
            }),
            updateById: async (_id: string, data: { status: string }) => ({
                _id: applicationId,
                status: data.status,
            }),
        },
    });

    const withdrawn = await service.withdrawApplication(
        userId.toString(),
        applicationId.toString()
    );

    assert.equal(withdrawn?.status, "withdrawn");
});
