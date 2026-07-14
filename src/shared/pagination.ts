/** Parsed, clamped pagination inputs plus a Mongoose skip/limit pair. */
export interface Pagination {
  page: number;
  limit: number;
  skip: number;
}

export const getPagination = (
  pageInput?: number,
  limitInput?: number,
  maxLimit = 60,
): Pagination => {
  const page = Math.max(1, Math.floor(pageInput ?? 1));
  const limit = Math.min(maxLimit, Math.max(1, Math.floor(limitInput ?? 12)));
  return { page, limit, skip: (page - 1) * limit };
};

/** Build the `meta` block for a paginated list response. */
export const buildMeta = (page: number, limit: number, total: number) => ({
  page,
  limit,
  total,
  totalPages: Math.max(1, Math.ceil(total / limit)),
});
