import type { Types } from "mongoose";
import Worker from "./worker.model.js";
import type { IWorker } from "./worker.interface.js";

export class WorkerRepository {
    async create(data: IWorker): Promise<IWorker> {
        const worker = await Worker.create(data);
        return worker.toObject();
    }

    async findByUserId(
        userId: string | Types.ObjectId
    ): Promise<IWorker | null> {
        return Worker.findOne({ userId })
            .lean<IWorker>()
            .exec();
    }

    async updateByUserId(
        userId: string | Types.ObjectId,
        data: Partial<IWorker>
    ): Promise<IWorker | null> {
        return Worker.findOneAndUpdate(
            { userId },
            { $set: data },
            {
                new: true,
                runValidators: true,
            }
        )
            .lean<IWorker>()
            .exec();
    }

    async deleteByUserId(
        userId: string | Types.ObjectId
    ): Promise<boolean> {
        const result = await Worker.deleteOne({ userId }).exec();

        return result.deletedCount === 1;
    }
}

export default WorkerRepository;
