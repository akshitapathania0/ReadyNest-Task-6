import { Response } from 'express';

export interface ApiResponse<T = unknown> {
  success: boolean;
  message: string;
  data?: T;
  errors?: unknown;
  pagination?: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export const sendSuccess = <T>(
  res: Response,
  message: string,
  data?: T,
  statusCode = 200,
  pagination?: ApiResponse['pagination']
): Response => {
  const response: Record<string, unknown> = {
    success: true,
    message,
  };
  if (data !== undefined) response.data = data;
  if (pagination) response.pagination = pagination;
  return res.status(statusCode).json(response);
};

export const sendError = (
  res: Response,
  message: string,
  statusCode = 500,
  errors?: unknown
): Response => {
  const response: Record<string, unknown> = {
    success: false,
    message,
  };
  if (errors !== undefined) response.errors = errors;
  return res.status(statusCode).json(response);
};

export const getPaginationParams = (query: Record<string, string | string[] | undefined>) => {
  const page = Math.max(1, parseInt(String(query.page || '1')));
  const limit = Math.min(100, Math.max(1, parseInt(String(query.limit || '10'))));
  const skip = (page - 1) * limit;
  return { page, limit, skip };
};
