import { Types } from "mongoose";
import { ApiError } from "../../utils/ApiError.js";
import { getPagination } from "../../utils/pagination.js";
import type { UserRole } from "../user/user.interface.js";
import type { ICompany } from "./company.interface.js";
import CompanyRepository from "./company.repository.js";
import type {
    CreateCompanyInput,
    UpdateCompanyInput,
} from "./company.validation.js";

export class CompanyService {
    constructor(
        private readonly companyRepository: CompanyRepository
    ) {}

    private canManageCompany(
        company: ICompany,
        userId: string,
        role: UserRole
    ): boolean {
        if (role === "admin" || role === "superAdmin") {
            return true;
        }

        return company.recruiters.some(
            (recruiterId) => recruiterId.toString() === userId
        );
    }

    async createCompany(
        userId: string,
        data: CreateCompanyInput
    ): Promise<ICompany> {
        const existingCompany = await this.companyRepository.findByName(data.name);

        if (existingCompany) {
            throw new ApiError(409, "Company name already exists.");
        }

        return this.companyRepository.create({
            ...data,
            verificationStatus: "pending",
            recruiters: [new Types.ObjectId(userId)],
        });
    }

    async getCompanyById(id: string): Promise<ICompany> {
        const company = await this.companyRepository.findById(id);

        if (!company) {
            throw new ApiError(404, "Company not found.");
        }

        return company;
    }

    async getAllCompanies(page?: number, limit?: number) {
        const totalItems = await this.companyRepository.count();
        const pagination = getPagination({ page, limit }, totalItems);
        const companies = await this.companyRepository.findAll(
            pagination.skip,
            pagination.limit
        );

        return { companies, pagination };
    }

    async updateCompany(
        id: string,
        userId: string,
        role: UserRole,
        data: UpdateCompanyInput
    ): Promise<ICompany> {
        const company = await this.getCompanyById(id);

        if (!this.canManageCompany(company, userId, role)) {
            throw new ApiError(403, "You do not have permission to update this company.");
        }

        if (data.name && data.name !== company.name) {
            const existingCompany = await this.companyRepository.findByName(data.name);

            if (existingCompany) {
                throw new ApiError(409, "Company name already exists.");
            }
        }

        const updatedCompany = await this.companyRepository.updateById(id, data);

        if (!updatedCompany) {
            throw new ApiError(404, "Company not found.");
        }

        return updatedCompany;
    }

    async deleteCompany(
        id: string,
        userId: string,
        role: UserRole
    ): Promise<void> {
        const company = await this.getCompanyById(id);

        if (!this.canManageCompany(company, userId, role)) {
            throw new ApiError(403, "You do not have permission to delete this company.");
        }

        const deleted = await this.companyRepository.deleteById(id);

        if (!deleted) {
            throw new ApiError(404, "Company not found.");
        }
    }
}

export const companyService = new CompanyService(new CompanyRepository());

export default companyService;
