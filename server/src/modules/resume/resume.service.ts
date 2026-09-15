import { Types } from "mongoose";
import cloudinary from "../../config/cloudinary.js";
import { ApiError } from "../../utils/ApiError.js";
import WorkerRepository from "../worker/worker.repository.js";
import type { IResume } from "./resume.interface.js";
import ResumeRepository from "./resume.repository.js";

export class ResumeService {
    constructor(
        private readonly resumeRepository: ResumeRepository,
        private readonly workerRepository: WorkerRepository
    ) {}

    private uploadToCloudinary(
        file: Express.Multer.File
    ): Promise<{ url: string; publicId: string }> {
        return new Promise((resolve, reject) => {
            const uploadStream = cloudinary.uploader.upload_stream(
                {
                    folder: "job-portal/resumes",
                    resource_type: "raw",
                },
                (error, result) => {
                    if (error || !result) {
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

    async uploadResume(
        userId: string,
        file: Express.Multer.File
    ): Promise<IResume> {
        const worker = await this.workerRepository.findByUserId(userId);

        if (!worker || !worker._id) {
            throw new ApiError(404, "Worker profile not found.");
        }

        const cloudinaryFile = await this.uploadToCloudinary(file);

        try {
            const resume = await this.resumeRepository.create({
                userId: new Types.ObjectId(userId),
                workerId: worker._id,
                originalName: file.originalname,
                fileName: cloudinaryFile.publicId,
                filePath: cloudinaryFile.url,
                cloudinaryUrl: cloudinaryFile.url,
                cloudinaryPublicId: cloudinaryFile.publicId,
                mimeType: file.mimetype as IResume["mimeType"],
                size: file.size,
            });

            if (resume._id) {
                await this.workerRepository.updateByUserId(userId, {
                    resumeIds: [...worker.resumeIds, resume._id],
                });
            }

            return resume;
        } catch (error) {
            await cloudinary.uploader.destroy(cloudinaryFile.publicId, {
                resource_type: "raw",
            });
            throw error;
        }
    }

    async getMyResumes(userId: string): Promise<IResume[]> {
        return this.resumeRepository.findByUserId(userId);
    }

    async getMyResumeById(userId: string, resumeId: string): Promise<IResume> {
        const resume = await this.resumeRepository.findById(resumeId);

        if (!resume || resume.userId.toString() !== userId) {
            throw new ApiError(404, "Resume not found.");
        }

        return resume;
    }

    async deleteResume(userId: string, resumeId: string): Promise<void> {
        const resume = await this.getMyResumeById(userId, resumeId);
        const worker = await this.workerRepository.findByUserId(userId);

        if (resume.cloudinaryPublicId) {
            await cloudinary.uploader.destroy(resume.cloudinaryPublicId, {
                resource_type: "raw",
            });
        }

        const deletedResume = await this.resumeRepository.deleteById(resumeId);

        if (!deletedResume) {
            throw new ApiError(404, "Resume not found.");
        }

        if (worker) {
            await this.workerRepository.updateByUserId(userId, {
                resumeIds: worker.resumeIds.filter(
                    (id) => id.toString() !== resumeId
                ),
            });
        }
    }
}

export const resumeService = new ResumeService(
    new ResumeRepository(),
    new WorkerRepository()
);

export default resumeService;
