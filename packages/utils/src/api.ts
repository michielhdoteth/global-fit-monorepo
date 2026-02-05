/**
 * API Utilities
 * Helper functions for API responses and error handling
 */

/**
 * Standard API response format
 */
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
  timestamp: string;
}

/**
 * Success response builder
 */
export function successResponse<T>(
  data: T,
  message?: string
): ApiResponse<T> {
  return {
    success: true,
    data,
    message,
    timestamp: new Date().toISOString(),
  };
}

/**
 * Error response builder
 */
export function errorResponse(error: string, message?: string): ApiResponse {
  return {
    success: false,
    error,
    message,
    timestamp: new Date().toISOString(),
  };
}

/**
 * Paginated response format
 */
export interface PaginatedResponse<T> extends ApiResponse {
  data?: T[];
  pagination?: {
    page: number;
    pageSize: number;
    total: number;
    pages: number;
  };
}

/**
 * Paginated response builder
 */
export function paginatedResponse<T>(
  data: T[],
  page: number,
  pageSize: number,
  total: number
): PaginatedResponse<T> {
  return {
    success: true,
    data,
    pagination: {
      page,
      pageSize,
      total,
      pages: Math.ceil(total / pageSize),
    },
    timestamp: new Date().toISOString(),
  };
}

/**
 * Parse query parameters
 */
export function parseQueryParams(
  query: Record<string, string | string[] | undefined>
): {
  page: number;
  pageSize: number;
  sort?: string;
  order?: "asc" | "desc";
  search?: string;
} {
  const page = Math.max(1, parseInt(String(query.page || 1), 10));
  const pageSize = Math.min(100, parseInt(String(query.pageSize || 10), 10));
  const sort = query.sort ? String(query.sort) : undefined;
  const order =
    (String(query.order) as "asc" | "desc") === "desc" ? "desc" : "asc";
  const search = query.search ? String(query.search) : undefined;

  return { page, pageSize, sort, order, search };
}

/**
 * Calculate pagination offset
 */
export function getPaginationOffset(page: number, pageSize: number): number {
  return (page - 1) * pageSize;
}

/**
 * Handle API errors with proper HTTP status codes
 */
export function getHttpStatus(
  error: string
): 400 | 401 | 403 | 404 | 500 {
  const statusMap: Record<string, 400 | 401 | 403 | 404 | 500> = {
    "Invalid request": 400,
    Unauthorized: 401,
    "Access denied": 403,
    "Not found": 404,
  };

  for (const [key, status] of Object.entries(statusMap)) {
    if (error.includes(key)) return status;
  }

  return 500;
}

/**
 * Validate authorization header
 */
export function validateAuthHeader(
  authHeader?: string
): { valid: boolean; token?: string } {
  if (!authHeader) return { valid: false };

  const parts = authHeader.split(" ");
  if (parts.length !== 2 || parts[0] !== "Bearer") {
    return { valid: false };
  }

  return { valid: true, token: parts[1] };
}

/**
 * Rate limit key generator
 */
export function getRateLimitKey(
  identifier: string,
  prefix: string = "rate-limit"
): string {
  return `${prefix}:${identifier}:${Math.floor(Date.now() / 60000)}`;
}

/**
 * Request signature verification (for webhooks)
 */
export function verifySignature(
  payload: string,
  signature: string,
  secret: string
): boolean {
  const crypto = require("crypto");
  const expectedSignature = crypto
    .createHmac("sha256", secret)
    .update(payload)
    .digest("hex");

  return signature === expectedSignature;
}
