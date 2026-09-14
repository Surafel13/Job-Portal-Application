export interface PaginationOptions {
    page?: number;
    limit?: number;
    maxLimit?: number;
}

export interface PaginationResult {
    page: number;
    limit: number;
    skip: number;
    totalPages: number;
    totalItems: number;
    hasNextPage: boolean;
    hasPreviousPage: boolean;
}

export const getPagination = (
    options: PaginationOptions = {},
    totalItems = 0
): PaginationResult => {
    const page = Math.max(1, Number(options.page) || 1);
    const maxLimit = Math.max(1, Number(options.maxLimit) || 100);
    const limit = Math.min(
        maxLimit,
        Math.max(1, Number(options.limit) || 10)
    );

    const skip = (page - 1) * limit;
    const totalPages = Math.ceil(totalItems / limit);

    return {
        page,
        limit,
        skip,
        totalPages,
        totalItems,
        hasNextPage: page < totalPages,
        hasPreviousPage: page > 1,
    };

};
