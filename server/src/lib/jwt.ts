import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';
import type { AuthPayload } from '../middleware/auth.js';

export const signToken = (payload: AuthPayload): string =>
  jwt.sign(payload, env.JWT_SECRET, { expiresIn: env.JWT_EXPIRES_IN } as jwt.SignOptions);

export const verifyToken = (token: string): AuthPayload => {
  const decoded = jwt.verify(token, env.JWT_SECRET);
  if (typeof decoded === 'string' || !decoded.sub || !decoded.role) throw new Error('Invalid token payload');
  return { sub: String(decoded.sub), role: decoded.role as AuthPayload['role'], name: String(decoded.name ?? '') };
};
