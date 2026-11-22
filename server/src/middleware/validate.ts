import type { NextFunction, Request, Response } from 'express';
import type { ZodTypeAny, z } from 'zod';

type Source = 'body' | 'query' | 'params';

export const validate =
  <T extends ZodTypeAny>(schema: T, source: Source = 'body') =>
  (req: Request, _res: Response, next: NextFunction): void => {
    const result = schema.safeParse(req[source]);
    if (!result.success) return next(result.error);
    // Express 4 allows replacing query/params; cast avoids readonly friction.
    (req as unknown as Record<string, unknown>)[source] = result.data as z.infer<T>;
    next();
  };
