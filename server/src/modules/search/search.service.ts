import searchRepository from "./search.repository.js";

interface SearchJobFilters {
    keyword?: string;
    location?: string;
    employmentType?: string;
    categoryId?: string;
    skillIds?: string[];
}

interface SearchOptions {
    page: number;
    limit: number;
}

class SearchService {
    async searchJobs(
        filters: SearchJobFilters,
        options: SearchOptions
    ) {
        const { page, limit } = options;

        const skip = (page - 1) * limit;

        const { jobs, total } =
            await searchRepository.searchJobs(
                filters,
                skip,
                limit
            );

        const totalPages = Math.ceil(total / limit);

        return {
            jobs,
            meta: {
                page,
                limit,
                total,
                totalPages,
                hasNextPage: page < totalPages,
                hasPreviousPage: page > 1,
            },
        };
    }
}

export default new SearchService();