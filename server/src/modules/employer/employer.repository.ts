import type { Types } from "mongoose";
import Employer from "./employer.model.js";
import type { IEmployer } from "./employer.interface.js";

export class EmployerRepository {
    async create(data: IEmployer): Promise<IEmployer> {
        const employer = await Employer.create(data);
        return employer.toObject();
    }

    async findById(id: string | Types.ObjectId): Promise<IEmployer | null> {
        return Employer.findById(id)
            .lean<IEmployer>()
            .exec();
    }

    async findByName(name: string): Promise<IEmployer | null> {
        return Employer.findOne({ name })
            .lean<IEmployer>()
            .exec();
    }

    async findAll(skip: number, limit: number): Promise<IEmployer[]> {
        return Employer.find()
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit)
            .lean<IEmployer[]>()
            .exec();
    }

    async existsById(employerId: Types.ObjectId): Promise<boolean> {
        const employer = await Employer.exists({
            _id: employerId,
        });

        return employer !== null;
    }

    async isVerified(employerId: Types.ObjectId): Promise<boolean> {
        const employer = await Employer.exists({
            _id: employerId,
            verificationStatus: "verified",
        });

        return employer !== null;
    }

    async count(): Promise<number> {
        return Employer.countDocuments();
    }

    async updateById(
        id: string,
        data: Partial<IEmployer>
    ): Promise<IEmployer | null> {
        return Employer.findByIdAndUpdate(
            id,
            { $set: data },
            {
                new: true,
                runValidators: true,
            }
        )
            .lean<IEmployer>()
            .exec();
    }

    async deleteById(id: string): Promise<boolean> {
        const result = await Employer.deleteOne({ _id: id }).exec();

        return result.deletedCount === 1;
    }
}

export default EmployerRepository;