import test, { mock } from "node:test";
import assert from "node:assert/strict";
import { Types } from "mongoose";
import { ResumeService } from "./resume.service.js";
import { ApiError } from "../../utils/ApiError.js";

const pdfFile = {
    originalname: "cv.pdf",
    mimetype: "application/pdf",
    size: 12,
    buffer: Buffer.from("%PDF-1.4 abc"),
} as Express.Multer.File;

const createService = (overrides: Record<string, unknown> = {}) => {
    const userId = new Types.ObjectId();
    const workerId = new Types.ObjectId();
    const resumeId = new Types.ObjectId();
    const destroyedPublicIds: string[] = [];

    const resumeRepository = {
        create: async (data: unknown) => ({
            ...(data as object),
            _id: resumeId,
        }),
        findById: async () => ({
            _id: resumeId,
            userId,
            workerId,
            originalName: "cv.pdf",
            cloudinaryPublicId: "old-id",
        }),
        updateById: async (_id: string, data: unknown) => ({
            _id: resumeId,
            userId,
            ...(data as object),
        }),
        deleteById: async () => ({ _id: resumeId }),
        findByUserId: async () => [],
        ...((overrides.resumeRepository as object) ?? {}),
    };

    const workerRepository = {
        findByUserId: async () => ({
            _id: workerId,
            userId,
            skills: [],
            categoryIds: [],
            education: [],
            experience: [],
            preferredJobTypes: [],
            preferredLocations: [],
            preferredWorkTypes: [],
            resumeIds: [],
            profileCompletion: 0,
        }),
        addResumeId: async () => ({}),
        removeResumeId: async () => ({}),
        ...((overrides.workerRepository as object) ?? {}),
    };

    const applicationRepository = {
        countByResumeId: async () => 0,
        ...((overrides.applicationRepository as object) ?? {}),
    };

    const applicantRepository = {
        existsByResumeId: async () => false,
        ...((overrides.applicantRepository as object) ?? {}),
    };

    const service = new ResumeService(
        resumeRepository as never,
        workerRepository as never,
        applicationRepository as never,
        applicantRepository as never
    );

    mock.method(
        service as unknown as { uploadToCloudinary: () => Promise<unknown> },
        "uploadToCloudinary",
        async () => ({
            url: "https://cdn.example/resume",
            publicId: "job-portal/resumes/new",
        })
    );

    mock.method(
        service as unknown as {
            destroyCloudinaryFile: (publicId: string) => Promise<void>;
        },
        "destroyCloudinaryFile",
        async (publicId: string) => {
            destroyedPublicIds.push(publicId);
        }
    );

    return { service, userId, resumeId, destroyedPublicIds };
};

test("ResumeService uploads a validated resume and attaches it to the worker", async () => {
    const { service, userId, resumeId } = createService();
    const resume = await service.uploadResume(userId.toString(), pdfFile);

    assert.equal(resume._id?.toString(), resumeId.toString());
    assert.equal(resume.originalName, "cv.pdf");
    assert.equal(resume.cloudinaryUrl, "https://cdn.example/resume");
});

test("ResumeService rejects files that fail content validation", async () => {
    const { service, userId } = createService();

    await assert.rejects(
        () =>
            service.uploadResume(userId.toString(), {
                ...pdfFile,
                buffer: Buffer.from("not-a-pdf"),
                size: 9,
            } as Express.Multer.File),
        (error: unknown) => error instanceof ApiError && error.statusCode === 400
    );
});

test("ResumeService blocks deleting resumes referenced by applications", async () => {
    const { service, userId, resumeId } = createService({
        applicationRepository: {
            countByResumeId: async () => 2,
        },
    });

    await assert.rejects(
        () => service.deleteResume(userId.toString(), resumeId.toString()),
        (error: unknown) =>
            error instanceof ApiError &&
            error.statusCode === 409 &&
            error.message.includes("applications")
    );
});

test("ResumeService preserves the old resume when replacing it", async () => {
    const replacementId = new Types.ObjectId();
    let updatedExistingResume = false;
    const { service, userId, resumeId, destroyedPublicIds } = createService({
        resumeRepository: {
            create: async (data: unknown) => ({
                ...(data as object),
                _id: replacementId,
            }),
            updateById: async () => {
                updatedExistingResume = true;
                return null;
            },
        },
    });

    const updated = await service.replaceResume(
        userId.toString(),
        resumeId.toString(),
        pdfFile
    );

    assert.equal(updated._id?.toString(), replacementId.toString());
    assert.equal(updated.cloudinaryPublicId, "job-portal/resumes/new");
    assert.equal(updatedExistingResume, false);
    assert.deepEqual(destroyedPublicIds, []);
});

test("ResumeService hides resumes owned by another user", async () => {
    const { service, resumeId } = createService();

    await assert.rejects(
        () =>
            service.getMyResumeById(
                new Types.ObjectId().toString(),
                resumeId.toString()
            ),
        (error: unknown) =>
            error instanceof ApiError && error.statusCode === 404
    );
});

test("ResumeService rolls back database metadata when linking the resume fails", async () => {
    let deletedResumeId: string | undefined;
    const { service, userId, resumeId, destroyedPublicIds } = createService({
        resumeRepository: {
            deleteById: async (id: string) => {
                deletedResumeId = id;
                return { _id: resumeId };
            },
        },
        workerRepository: {
            addResumeId: async () => {
                throw new Error("worker update failed");
            },
        },
    });

    await assert.rejects(
        () => service.uploadResume(userId.toString(), pdfFile),
        /worker update failed/
    );
    assert.equal(deletedResumeId, resumeId.toString());
    assert.deepEqual(destroyedPublicIds, ["job-portal/resumes/new"]);
});
