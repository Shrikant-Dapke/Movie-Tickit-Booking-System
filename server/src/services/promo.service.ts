import type { ClientSession } from 'mongoose';
import { Promo } from '../models/Promo.js';
import { badRequest } from '../lib/http.js';

export interface PromoEvaluation {
  code: string;
  type: 'percent' | 'fixed';
  discountPercent?: number;
  discount: number;
  total: number;
  valid: true;
}

/**
 * Single source of truth for promo validation, used by both /promo/validate
 * and the booking engine. The client is never trusted to compute discounts.
 */
export const evaluatePromo = async (
  rawCode: string,
  amount: number,
  options: { consume?: boolean; session?: ClientSession } = {},
): Promise<PromoEvaluation> => {
  const code = rawCode.trim().toUpperCase();
  const promo = await Promo.findOne({ code, active: true }, null, { session: options.session });

  if (!promo) throw badRequest('This promo code is invalid or inactive');
  if (promo.expiresAt && promo.expiresAt.getTime() <= Date.now()) throw badRequest('This promo code has expired');
  const limited = typeof promo.maxUses === 'number' && promo.maxUses > 0;
  if (limited && (promo.usedCount ?? 0) >= promo.maxUses!) throw badRequest('This promo code has reached its usage limit');
  if (amount < promo.minAmount) throw badRequest(`This code requires a minimum booking of ₹${promo.minAmount}`);

  const type = promo.type ?? 'percent';
  let discount: number;
  if (type === 'fixed') {
    discount = Math.min(promo.fixedAmount ?? 0, amount);
  } else {
    discount = Math.min(Math.round((amount * (promo.discountPercent ?? 0)) / 100), promo.maxDiscount);
  }
  if (discount <= 0) throw badRequest('This promo code does not apply to this booking');

  if (options.consume) {
    const filter = limited
      ? { _id: promo._id, usedCount: { $lt: promo.maxUses! } }
      : { _id: promo._id };
    const result = await Promo.updateOne(filter, { $inc: { usedCount: 1 } }, { session: options.session });
    if (result.matchedCount !== 1) throw badRequest('This promo code has reached its usage limit');
  }

  return {
    code: promo.code,
    type,
    ...(type === 'percent' ? { discountPercent: promo.discountPercent ?? 0 } : {}),
    discount,
    total: Math.max(0, amount - discount),
    valid: true,
  };
};
