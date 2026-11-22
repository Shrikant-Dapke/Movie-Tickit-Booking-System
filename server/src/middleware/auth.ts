import type { NextFunction, Request, Response } from 'express';
import { forbidden, unauthorized } from '../lib/http.js';
import { verifyToken } from '../lib/jwt.js';

export type Role = 'customer' | 'admin';
export interface AuthPayload {
  sub: string;
  role: Role;
  name: string;
}

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      user?: AuthPayload;
    }
  }
}

const readToken = (req: Request): string | null => {
  const header = req.headers.authorization;
  if (!header) return null;
  const [scheme, token] = header.split(' ');
  if (scheme?.toLowerCase() !== 'bearer' || !token) return null;
  return token;
};

export const authenticate = (req: Request, _res: Response, next: NextFunction): void => {
  const token = readToken(req);
  if (!token) return next(unauthorized());
  try {
    req.user = verifyToken(token);
    next();
  } catch {
    next(unauthorized('Your session has expired. Please sign in again.'));
  }
};

export const optionalAuth = (req: Request, _res: Response, next: NextFunction): void => {
  const token = readToken(req);
  if (!token) return next();
  try {
    req.user = verifyToken(token);
  } catch {
    // optional auth never rejects; it simply treats the caller as anonymous
  }
  next();
};

export const requireAdmin = (req: Request, _res: Response, next: NextFunction): void => {
  if (!req.user) return next(unauthorized());
  if (req.user.role !== 'admin') return next(forbidden('Admin access required'));
  next();
};
