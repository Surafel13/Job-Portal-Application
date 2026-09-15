import { ApiError } from "../../utils/ApiError.js";
import { getPagination } from "../../utils/pagination.js";
import type { ISkill } from "./skill.interface.js";
import SkillRepository from "./skill.repository.js";
import type {
    CreateSkillInput,
    UpdateSkillInput,
} from "./skill.validation.js";

export class SkillService {
    constructor(
        private readonly skillRepository: SkillRepository
    ) {}

    async createSkill(data: CreateSkillInput): Promise<ISkill> {
        const existingName = await this.skillRepository.findByName(data.name);

        if (existingName) {
            throw new ApiError(409, "Skill name already exists.");
        }

        const existingSlug = await this.skillRepository.findBySlug(data.slug);

        if (existingSlug) {
            throw new ApiError(409, "Skill slug already exists.");
        }

        return this.skillRepository.create({
            ...data,
            isActive: data.isActive ?? true,
        });
    }

    async getSkillById(id: string): Promise<ISkill> {
        const skill = await this.skillRepository.findById(id);

        if (!skill) {
            throw new ApiError(404, "Skill not found.");
        }

        return skill;
    }

    async getAllSkills(page?: number, limit?: number) {
        const totalItems = await this.skillRepository.count();
        const pagination = getPagination({ page, limit }, totalItems);
        const skills = await this.skillRepository.findAll(
            pagination.skip,
            pagination.limit
        );

        return { skills, pagination };
    }

    async updateSkill(
        id: string,
        data: UpdateSkillInput
    ): Promise<ISkill> {
        const skill = await this.getSkillById(id);

        if (data.name && data.name !== skill.name) {
            const existingName = await this.skillRepository.findByName(data.name);

            if (existingName) {
                throw new ApiError(409, "Skill name already exists.");
            }
        }

        if (data.slug && data.slug !== skill.slug) {
            const existingSlug = await this.skillRepository.findBySlug(data.slug);

            if (existingSlug) {
                throw new ApiError(409, "Skill slug already exists.");
            }
        }

        const updatedSkill = await this.skillRepository.updateById(id, data);

        if (!updatedSkill) {
            throw new ApiError(404, "Skill not found.");
        }

        return updatedSkill;
    }

    async deleteSkill(id: string): Promise<void> {
        const deleted = await this.skillRepository.deleteById(id);

        if (!deleted) {
            throw new ApiError(404, "Skill not found.");
        }
    }
}

export const skillService = new SkillService(new SkillRepository());

export default skillService;
