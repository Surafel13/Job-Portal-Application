import Resume from "./resume.model.js";
import type { IResume } from "./resume.interface.js";

export class ResumeRepository {
    async create(data: IResume): Promise<IResume> {
        const resume = await Resume.create(data);
        return resume.toObject();
    }

    async findById(id: string): Promise<IResume | null> {
        return Resume.findById(id)
            .lean<IResume>()
            .exec();
    }

    async findByUserId(userId: string): Promise<IResume[]> {
        return Resume.find({ userId })
            .sort({ createdAt: -1 })
            .lean<IResume[]>()
            .exec();
    }

    async deleteById(id: string): Promise<IResume | null> {
        return Resume.findByIdAndDelete(id)
            .lean<IResume>()
            .exec();
    }
}

export default ResumeRepository;
