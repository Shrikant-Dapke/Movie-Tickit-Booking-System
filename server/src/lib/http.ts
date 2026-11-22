import type { NextFunction, Request, RequestHandler, Response } from 'express';
import { ZodError } from 'zod';
import mongoose from 'mongoose';

export class ApiError extends Error {
  public readonly statusCode: number;
  public readonly code: string;
  public readonly details?: Record<string, string>;
  public readonly data?: unknown;

  constructor(statusCode: number, message: string, code = 'ERROR', details?: Record<string, string>, data?: unknown) {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
    this.details = details;
    this.data = data;
    Object.setPrototypeOf(this, ApiError.prototype);
  }
}

export const badRequest = (message: string, details?: Record<string, string>) => new ApiError(400, message, 'BAD_REQUEST', details);
export const unauthorized = (message = 'Authentication required') => new ApiError(401, message, 'UNAUTHORIZED');
export const forbidden = (message = 'You do not have permission to perform this action') => new ApiError(403, message, 'FORBIDDEN');
export const notFound = (message = 'Resource not found') => new ApiError(404, message, 'NOT_FOUND');
export const conflict = (message: string) => new ApiError(409, message, 'CONFLICT');
export const paymentFailed = (message: string, data?: unknown) => new ApiError(402, message, 'PAYMENT_FAILED', undefined, data);

export const asyncHandler = (fn: (req: Request, res: Response, next: NextFunction) => unknown): RequestHandler =>
  (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);

export const ok = <T>(res: Response, data: T, message?: string, status = 200): Response =>
  res.status(status).json({ success: true, data, ...(message ? { message } : {}) });

export const noContent = (res: Response): Response => res.status(204).send();

export const errorHandler = (err: unknown, _req: Request, res: Response, _next: NextFunction): Response => {
  if (err instanceof ApiError) {
    return res.status(err.statusCode).json({
      success: false,
      message: err.message,
      code: err.code,
      ...(err.details ? { errors: err.details } : {}),
      ...(err.data !== undefined ? { data: err.data } : {}),
    });
  }

  if (err instanceof ZodError) {
    const details: Record<string, string> = {};
    for (const issue of err.issues) details[issue.path.join('.') || 'body'] = issue.message;
    return res.status(400).json({ success: false, message: 'Invalid input', code: 'VALIDATION_ERROR', errors: details });
  }

  if (err instanceof mongoose.Error.ValidationError) {
    const details: Record<string, string> = {};
    for (const [key, value] of Object.entries(err.errors)) details[key] = value.message;
    return res.status(400).json({ success: false, message: 'Invalid input', code: 'VALIDATION_ERROR', errors: details });
  }

  if (err instanceof mongoose.Error.CastError) {
    return res.status(400).json({ success: false, message: `Invalid value for ${err.path}`, code: 'CAST_ERROR' });
  }

  if (typeof err === 'object' && err !== null && 'code' in err && (err as { code: number }).code === 11000) {
    const key = (err as { keyPattern?: Record<string, unknown> }).keyPattern ?? {};
    return res.status(409).json({
      success: false,
      message: 'This value is already in use',
      code: 'DUPLICATE_KEY',
      errors: Object.fromEntries(Object.keys(key).map((k) => [k, 'already exists'])),
    });
  }

  console.error('[error]', err);
  return res.status(500).json({ success: false, message: 'Unexpected server error', code: 'INTERNAL_ERROR' });
};

export const notFoundHandler = (req: Request, res: Response): Response =>
  res.status(404).json({ success: false, message: `Route ${req.method} ${req.path} not found`, code: 'ROUTE_NOT_FOUND' });
