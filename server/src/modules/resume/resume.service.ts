import { Types } from "mongoose";
import cloudinary from "../../config/cloudinary.js";
import { ApiError } from "../../utils/ApiError.js";
import logger from "../../utils/logger.js";
import { ApplicantRepository } from "../applicant/applicant.repository.js";
import { ApplicationRepository } from "../application/application.repository.js";
import {
    calculateWorkerProfileCompletion,
} from "../worker/worker.completion.js";
import type { IWorker } from "../worker/worker.interface.js";
import WorkerRepository from "../worker/worker.repository.js";
import type { IResume } from "./resume.interface.js";
import ResumeRepository from "./resume.repository.js";
import { validateResumeFile } from "./resumeFile.js";

export class ResumeService {
    constructor(
        private readonly resumeRepository: ResumeRepository,
        private readonly workerRepository: WorkerRepository,
        private readonly applicationRepository: ApplicationRepository,
        private readonly applicantRepository: ApplicantRepository
    ) {}

    private async destroyCloudinaryFile(publicId?: string): Promise<void> {
        if (!publicId) {
            return;
        }

        try {
            await cloudinary.uploader.destroy(publicId, {
                resource_type: "raw",
            });
        } catch (error) {
            logger.warn("Failed to delete resume file from Cloudinary.", {
                publicId,
                error,
            });
        }
    }

    private uploadToCloudinary(
        file: Express.Multer.File
    ): Promise<{ url: string; publicId: string }> {
        return new Promise((resolve, reject) => {
            const uploadStream = cloudinary.uploader.upload_stream(
                {
                    folder: "job-portal/resumes",
                    resource_type: "raw",
                    use_filename: true,
                    unique_filename: true,
                    overwrite: false,
                },
                (error, result) => {
                    if (error || !result) {
                        logger.error("Cloudinary resume upload failed.", {
                            error,
                        });
                        reject(new ApiError(500, "Failed to upload resume file."));
                        return;
                    }

                    resolve({
                        url: result.secure_url,
                        publicId: result.public_id,
                    });
                }
            );

            uploadStream.end(file.buffer);
        });
    }

    private async createResumeVersion(
        userId: string,
        workerId: Types.ObjectId,
        worker: IWorker,
        file: Express.Multer.File,
        metadata: ReturnType<typeof validateResumeFile>,
        cloudinaryFile: { url: string; publicId: string }
    ): Promise<IResume> {
        let resume: IResume | null = null;

        try {
            const { originalName, mimeType } = metadata;
            resume = await this.resumeRepository.create({
                userId: new Types.ObjectId(userId),
                workerId,
                originalName,
                fileName: cloudinaryFile.publicId,
                filePath: cloudinaryFile.url,
                cloudinaryUrl: cloudinaryFile.url,
                cloudinaryPublicId: cloudinaryFile.publicId,
                mimeType,
                size: file.size,
            });

            if (!resume._id) {
                throw new ApiError(500, "Failed to save resume metadata.");
            }

            const createdResumeId = resume._id;
            const resumeIds = [
                ...(worker.resumeIds ?? []).filter(
                    (id) => id.toString() !== createdResumeId.toString()
                ),
                createdResumeId,
            ];
            const updatedWorker = await this.workerRepository.addResumeId(
                userId,
                createdResumeId,
                calculateWorkerProfileCompletion({
                    ...worker,
                    resumeIds,
                })
            );

            if (!updatedWorker) {
                throw new ApiError(404, "Worker profile not found.");
            }

            return resume;
        } catch (error) {
            let canDeleteCloudinaryFile = true;

            if (resume?._id) {
                const failedResumeId = resume._id;
                const resumeIds = (worker.resumeIds ?? []).filter(
                    (id) => id.toString() !== failedResumeId.toString()
                );

                try {
                    await this.workerRepository.removeResumeId(
                        userId,
                        failedResumeId.toString(),
                        calculateWorkerProfileCompletion({
                            ...worker,
                            resumeIds,
                        })
                    );
                } catch (cleanupError) {
                    logger.error("Failed to roll back worker resume reference.", {
                        resumeId: resume._id.toString(),
                        cleanupError,
                    });
                }

                try {
                    await this.resumeRepository.deleteById(
                        failedResumeId.toString()
                    );
                } catch (cleanupError) {
                    canDeleteCloudinaryFile = false;
                    logger.error("Failed to roll back resume metadata.", {
                        resumeId: failedResumeId.toString(),
                        cleanupError,
                    });
                }
            }

            if (canDeleteCloudinaryFile) {
                await this.destroyCloudinaryFile(cloudinaryFile.publicId);
            }
            throw error;
        }
    }

    private async getOwnedResume(
        userId: string,
        resumeId: string
    ): Promise<IResume> {
        const resume = await this.resumeRepository.findById(resumeId);

        if (!resume || resume.userId.toString() !== userId) {
            throw new ApiError(404, "Resume not found.");
        }

        return resume;
    }

    private async restoreWorkerResumeReference(
        userId: string,
        resume: IResume,
        worker: IWorker
    ): Promise<void> {
        if (!resume._id) {
            return;
        }

        try {
            await this.workerRepository.addResumeId(
                userId,
                resume._id,
                calculateWorkerProfileCompletion(worker)
            );
        } catch (cleanupError) {
            logger.error("Failed to restore worker resume reference.", {
                resumeId: resume._id.toString(),
                cleanupError,
            });
        }
    }

    async uploadResume(
        userId: string,
        file: Express.Multer.File
    ): Promise<IResume> {
        const worker = await this.workerRepository.findByUserId(userId);

        if (!worker || !worker._id) {
            throw new ApiError(404, "Worker profile not found.");
        }

        const metadata = validateResumeFile(file);
        const cloudinaryFile = await this.uploadToCloudinary(file);

        return this.createResumeVersion(
            userId,
            worker._id,
            worker,
            file,
            metadata,
            cloudinaryFile
        );
    }

    async getMyResumes(userId: string): Promise<IResume[]> {
        return this.resumeRepository.findByUserId(userId);
    }

    async getMyResumeById(userId: string, resumeId: string): Promise<IResume> {
        return this.getOwnedResume(userId, resumeId);
    }

    async replaceResume(
        userId: string,
        resumeId: string,
        file: Express.Multer.File
    ): Promise<IResume> {
        await this.getOwnedResume(userId, resumeId);
        const worker = await this.workerRepository.findByUserId(userId);

        if (!worker?._id) {
            throw new ApiError(404, "Worker profile not found.");
        }

        const metadata = validateResumeFile(file);
        const cloudinaryFile = await this.uploadToCloudinary(file);

        return this.createResumeVersion(
            userId,
            worker._id,
            worker,
            file,
            metadata,
            cloudinaryFile
        );
    }

    async deleteResume(userId: string, resumeId: string): Promise<void> {
        const resume = await this.getOwnedResume(userId, resumeId);
        const worker = await this.workerRepository.findByUserId(userId);

        const applicationCount =
            await this.applicationRepository.countByResumeId(resumeId);

        if (applicationCount > 0) {
            throw new ApiError(
                409,
                "This resume is attached to existing applications and cannot be deleted. Replace the file instead."
            );
        }

        const isProfileResume =
            await this.applicantRepository.existsByResumeId(resumeId);

        if (isProfileResume) {
            throw new ApiError(
                409,
                "This resume is attached to your applicant profile and cannot be deleted. Replace the file instead."
            );
        }

        const hasWorkerReference = Boolean(
            worker?.resumeIds?.some((id) => id.toString() === resumeId)
        );

        if (worker && hasWorkerReference) {
            const resumeIds = worker.resumeIds.filter(
                (id) => id.toString() !== resumeId
            );
            let updatedWorker: Awaited<
                ReturnType<WorkerRepository["removeResumeId"]>
            >;

            try {
                updatedWorker = await this.workerRepository.removeResumeId(
                    userId,
                    resumeId,
                    calculateWorkerProfileCompletion({ ...worker, resumeIds })
                );
            } catch (error) {
                await this.restoreWorkerResumeReference(userId, resume, worker);
                throw error;
            }

            if (!updatedWorker) {
                await this.restoreWorkerResumeReference(userId, resume, worker);
                throw new ApiError(404, "Worker profile not found.");
            }
        }

        let deletedResume: IResume | null;

        try {
            deletedResume = await this.resumeRepository.deleteById(resumeId);
        } catch (error) {
            if (worker && hasWorkerReference && resume._id) {
                await this.restoreWorkerResumeReference(userId, resume, worker);
            }

            throw error;
        }

        if (!deletedResume) {
            if (worker && hasWorkerReference && resume._id) {
                await this.restoreWorkerResumeReference(userId, resume, worker);
            }

            throw new ApiError(404, "Resume not found.");
        }

        await this.destroyCloudinaryFile(resume.cloudinaryPublicId);
    }
}

export const resumeService = new ResumeService(
    new ResumeRepository(),
    new WorkerRepository(),
    new ApplicationRepository(),
    new ApplicantRepository()
);

export default resumeService;
