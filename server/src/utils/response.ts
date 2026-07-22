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
  return res.status(statusCode).json({
    success: true,
    message,
    data,
    ...(pagination && { pagination }),
  });
};

export const sendError = (
  res: Response,
  message: string,
  statusCode = 500,
  errors?: unknown
): Response => {
  return res.status(statusCode).json({
    success: false,
    message,
    ...(errors && { errors }),
  });
};

export const getPaginationParams = (query: Record<string, string | string[] | undefined>) => {
  const page = Math.max(1, parseInt(String(query.page || '1')));
  const limit = Math.min(100, Math.max(1, parseInt(String(query.limit || '10'))));
  const skip = (page - 1) * limit;
  return { page, limit, skip };
};
