import { Router } from 'express';
import { Promo } from '../../models/Promo.js';
import { authenticate } from '../../middleware/auth.js';
import { validate } from '../../middleware/validate.js';
import { asyncHandler, badRequest, ok } from '../../lib/http.js';
import { promoSchema } from '../../lib/validators.js';

export const promoRouter = Router();

promoRouter.post(
  '/validate',
  authenticate,
  validate(promoSchema),
  asyncHandler(async (req, res) => {
    const { code, amount } = req.body as { code: string; amount: number };
    const promo = await Promo.findOne({ code: code.toUpperCase(), active: true });
    if (!promo || (promo.expiresAt && promo.expiresAt.getTime() < Date.now())) throw badRequest('This promo code is invalid or expired');
    if (amount < promo.minAmount) throw badRequest(`This code requires a minimum booking of ₹${promo.minAmount}`);
    const discount = Math.min(Math.round((amount * promo.discountPercent) / 100), promo.maxDiscount);
    ok(res, { code: promo.code, discountPercent: promo.discountPercent, discount, total: Math.max(0, amount - discount), valid: true });
  }),
);
