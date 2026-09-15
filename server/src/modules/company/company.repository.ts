import type { Types } from "mongoose";
import Company from "./company.model.js";
import type { ICompany } from "./company.interface.js";

export class CompanyRepository {
    async create(data: ICompany): Promise<ICompany> {
        const company = await Company.create(data);
        return company.toObject();
    }

    async findById(id: string | Types.ObjectId): Promise<ICompany | null> {
        return Company.findById(id)
            .lean<ICompany>()
            .exec();
    }

    async findByName(name: string): Promise<ICompany | null> {
        return Company.findOne({ name })
            .lean<ICompany>()
            .exec();
    }

    async findAll(skip: number, limit: number): Promise<ICompany[]> {
        return Company.find()
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit)
            .lean<ICompany[]>()
            .exec();
    }

    async count(): Promise<number> {
        return Company.countDocuments();
    }

    async updateById(
        id: string,
        data: Partial<ICompany>
    ): Promise<ICompany | null> {
        return Company.findByIdAndUpdate(
            id,
            { $set: data },
            {
                new: true,
                runValidators: true,
            }
        )
            .lean<ICompany>()
            .exec();
    }

    async deleteById(id: string): Promise<boolean> {
        const result = await Company.deleteOne({ _id: id }).exec();

        return result.deletedCount === 1;
    }
}

export default CompanyRepository;
