export interface PaginationInfo {
  limit: number;
  hasNext: boolean;
  nextCursor?: string;
  sortOrder: 'asc' | 'desc';
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: PaginationInfo;
}
