import type { Types } from "mongoose";
import EmbeddingModel from "./embedding.model.js";
import type { IEmbedding } from "./embedding.interface.js";

export class EmbeddingRepository {
    async findByResource(
        resourceType: IEmbedding["resourceType"],
        resourceId: Types.ObjectId,
    ): Promise<Pick<IEmbedding, "contentHash"> | null> {
        return EmbeddingModel.findOne({ resourceType, resourceId })
            .select("contentHash")
            .lean<Pick<IEmbedding, "contentHash">>()
            .exec();
    }

    async findByResourceIds(
        resourceType: IEmbedding["resourceType"],
        resourceIds: Types.ObjectId[],
        modelVersion: string,
    ): Promise<Pick<IEmbedding, "resourceId" | "values">[]> {
        if (resourceIds.length === 0) {
            return [];
        }

        return EmbeddingModel.find({
            resourceType,
            resourceId: { $in: resourceIds },
            modelVersion,
        })
            .select("resourceId values")
            .lean<Pick<IEmbedding, "resourceId" | "values">[]>()
            .exec();
    }

    async upsert(data: IEmbedding): Promise<void> {
        await EmbeddingModel.findOneAndUpdate(
            {
                resourceType: data.resourceType,
                resourceId: data.resourceId,
            },
            { $set: data },
            {
                upsert: true,
                new: true,
                runValidators: true,
                setDefaultsOnInsert: true,
            },
        ).exec();
    }

    async deleteByResource(
        resourceType: IEmbedding["resourceType"],
        resourceId: Types.ObjectId,
    ): Promise<void> {
        await EmbeddingModel.deleteOne({ resourceType, resourceId }).exec();
    }
}

export const embeddingRepository = new EmbeddingRepository();

export default embeddingRepository;