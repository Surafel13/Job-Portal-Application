export interface ApiErrorIssue {
  field?: string;
  message: string;
}

export interface ApiResponse<T> {
  success: boolean;
  statusCode: number;
  message: string;
  data?: T;
  meta?: Record<string, unknown>;
  errors?: ApiErrorIssue[];
}

export interface PaginationMeta {
  page: number;
  limit: number;
  total?: number;
  totalPages?: number;
  totalItems?: number;
  hasNextPage?: boolean;
  hasPreviousPage?: boolean;
}
