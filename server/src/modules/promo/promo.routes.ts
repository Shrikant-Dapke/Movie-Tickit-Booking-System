import { Router } from 'express';
import { authenticate } from '../../middleware/auth.js';
import { validate } from '../../middleware/validate.js';
import { asyncHandler, ok } from '../../lib/http.js';
import { promoSchema } from '../../lib/validators.js';
import { evaluatePromo } from '../../services/promo.service.js';

export const promoRouter = Router();

promoRouter.post(
  '/validate',
  authenticate,
  validate(promoSchema),
  asyncHandler(async (req, res) => {
    const { code, amount } = req.body as { code: string; amount: number };
    ok(res, await evaluatePromo(code, amount));
  }),
);
