import { Types } from "mongoose";
import { ApiError } from "../../utils/ApiError.js";
import { getPagination } from "../../utils/pagination.js";
import type { UserRole } from "../user/user.interface.js";
import type { IEmployer } from "./employer.interface.js";
import EmployerRepository from "./employer.repository.js";
import type {
    CreateEmployerInput,
    UpdateEmployerInput,
} from "./employer.validation.js";

export class EmployerService {
    constructor(
        private readonly employerRepository: EmployerRepository
    ) {}

    private canManageEmployer(
        employer: IEmployer,
        userId: string,
        role: UserRole
    ): boolean {
        if (role === "admin" || role === "superAdmin") {
            return true;
        }

        return employer.recruiters.some(
            (recruiterId) => recruiterId.toString() === userId
        );
    }

    async createEmployer(
        userId: string,
        data: CreateEmployerInput
    ): Promise<IEmployer> {
        const existingEmployer = await this.employerRepository.findByName(data.name);

        if (existingEmployer) {
            throw new ApiError(409, "Employer name already exists.");
        }

        return this.employerRepository.create({
            ...data,
            verificationStatus: "pending",
            recruiters: [new Types.ObjectId(userId)],
        });
    }

    async getEmployerById(id: string): Promise<IEmployer> {
        const employer = await this.employerRepository.findById(id);

        if (!employer) {
            throw new ApiError(404, "Employer not found.");
        }

        return employer;
    }

    async getAllEmployers(page?: number, limit?: number) {
        const totalItems = await this.employerRepository.count();
        const pagination = getPagination({ page, limit }, totalItems);
        const employers = await this.employerRepository.findAll(
            pagination.skip,
            pagination.limit
        );

        return { employers, pagination };
    }

    async updateEmployer(
        id: string,
        userId: string,
        role: UserRole,
        data: UpdateEmployerInput
    ): Promise<IEmployer> {
        const employer = await this.getEmployerById(id);

        if (!this.canManageEmployer(employer, userId, role)) {
            throw new ApiError(403, "You do not have permission to update this employer.");
        }

        if (data.name && data.name !== employer.name) {
            const existingEmployer = await this.employerRepository.findByName(data.name);

            if (existingEmployer) {
                throw new ApiError(409, "Employer name already exists.");
            }
        }

        const updatedEmployer = await this.employerRepository.updateById(id, data);

        if (!updatedEmployer) {
            throw new ApiError(404, "Employer not found.");
        }

        return updatedEmployer;
    }

    async deleteEmployer(
        id: string,
        userId: string,
        role: UserRole
    ): Promise<void> {
        const employer = await this.getEmployerById(id);

        if (!this.canManageEmployer(employer, userId, role)) {
            throw new ApiError(403, "You do not have permission to delete this employer.");
        }

        const deleted = await this.employerRepository.deleteById(id);

        if (!deleted) {
            throw new ApiError(404, "Employer not found.");
        }
    }
}

export const employerService = new EmployerService(new EmployerRepository());

export default employerService;