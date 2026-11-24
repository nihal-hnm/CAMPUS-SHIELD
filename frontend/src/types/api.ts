export interface ApiError {
  code: number;
  reason_code?: string;
  message: string;
  request_id?: string;
  details?: unknown;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  page_size: number;
  has_more: boolean;
}
