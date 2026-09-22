import Job from "../job/job.model.js";
import { SearchJobFilters } from "./search.interface.js";


class SearchRepository {

    async searchJobs(
        filters: SearchJobFilters,
        skip: number,
        limit: number
    ) {
        const query: Record<string, any> = {
            status: "published",
        };

        const [jobs, total] = await Promise.all([
            Job.find(query)
                .populate("companyId")
                .populate("categoryId")
                .populate("skills")
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limit),

            Job.countDocuments(query),
        ]);

        return {
            jobs,
            total,
        };
    }
}

export default new SearchRepository();