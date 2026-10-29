/**
 * Sanitize utilities for input handling, regex escaping, and bounded pagination.
 */

export const escapeRegex = (str: string): string => {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
};

export const getPagination = (page?: any, limit?: any, defaultLimit = 20, maxLimit = 100) => {
  const parsedPage = Math.max(Number(page) || 1, 1);
  const parsedLimit = Math.min(Math.max(Number(limit) || defaultLimit, 1), maxLimit);
  const skip = (parsedPage - 1) * parsedLimit;
  return { page: parsedPage, limit: parsedLimit, skip };
};
