import { Types } from "mongoose";
import { ApiError } from "../../utils/ApiError.js";
import type { IWorker } from "./worker.interface.js";
import WorkerRepository from "./worker.repository.js";
import { calculateWorkerProfileCompletion } from "./worker.completion.js";
import type {
    CreateWorkerInput,
    UpdateWorkerInput,
} from "./worker.validation.js";

export class WorkerService {
    constructor(
        private readonly workerRepository: WorkerRepository
    ) {}

    private formatWorkerData(
        userId: string | undefined,
        data: CreateWorkerInput | UpdateWorkerInput
    ): Partial<IWorker> {
        const { skills, categoryIds, ...workerData } = data;

        return {
            ...workerData,
            ...(skills
                ? {
                    skills: skills.map((skill) => ({
                        ...skill,
                        skillId: new Types.ObjectId(skill.skillId),
                    })),
                }
                : {}),
            ...(categoryIds
                ? {
                    categoryIds: categoryIds.map(
                        (categoryId) => new Types.ObjectId(categoryId)
                    ),
                }
                : {}),
            ...(userId
                ? { userId: new Types.ObjectId(userId) }
                : {}),
        };
    }

    async createWorker(
        userId: string,
        data: CreateWorkerInput
    ): Promise<IWorker> {
        const existingWorker = await this.workerRepository.findByUserId(userId);

        if (existingWorker) {
            throw new ApiError(409, "Worker profile already exists.");
        }

        const workerData = this.formatWorkerData(userId, data) as IWorker;
        workerData.resumeIds = workerData.resumeIds ?? [];
        workerData.profileCompletion = calculateWorkerProfileCompletion({
            ...workerData,
            skills: workerData.skills ?? [],
            categoryIds: workerData.categoryIds ?? [],
            education: workerData.education ?? [],
            experience: workerData.experience ?? [],
            preferredJobTypes: workerData.preferredJobTypes ?? [],
            preferredLocations: workerData.preferredLocations ?? [],
            preferredWorkTypes: workerData.preferredWorkTypes ?? [],
            resumeIds: workerData.resumeIds,
        });

        return this.workerRepository.create(workerData);
    }

    async getWorkerByUserId(userId: string): Promise<IWorker> {
        const worker = await this.workerRepository.findByUserId(userId);

        if (!worker) {
            throw new ApiError(404, "Worker profile not found.");
        }

        return worker;
    }

    async updateWorker(
        userId: string,
        data: UpdateWorkerInput
    ): Promise<IWorker> {
        const existingWorker = await this.getWorkerByUserId(userId);
        const workerData = this.formatWorkerData(undefined, data);

        const minimumSalary =
            workerData.minimumSalary ?? existingWorker.minimumSalary;
        const maximumSalary =
            workerData.maximumSalary ?? existingWorker.maximumSalary;

        if (
            minimumSalary !== undefined &&
            maximumSalary !== undefined &&
            minimumSalary > maximumSalary
        ) {
            throw new ApiError(
                400,
                "Minimum salary cannot be greater than maximum salary."
            );
        }

        const mergedWorker: IWorker = {
            ...existingWorker,
            ...workerData,
        };

        workerData.profileCompletion =
            calculateWorkerProfileCompletion(mergedWorker);

        const worker = await this.workerRepository.updateByUserId(
            userId,
            workerData
        );

        if (!worker) {
            throw new ApiError(404, "Worker profile not found.");
        }

        return worker;
    }

    async deleteWorker(userId: string): Promise<void> {
        const deleted = await this.workerRepository.deleteByUserId(userId);

        if (!deleted) {
            throw new ApiError(404, "Worker profile not found.");
        }
    }
}

export const workerService = new WorkerService(
    new WorkerRepository()
);

export default workerService;


