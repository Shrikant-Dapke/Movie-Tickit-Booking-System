import { Schema, model, type InferSchemaType } from 'mongoose';
import { jsonOptions } from './base.js';

const promoSchema = new Schema(
  {
    code: { type: String, required: true, unique: true, uppercase: true, trim: true },
    description: String,
    type: { type: String, enum: ['percent', 'fixed'], default: 'percent' },
    // Legacy field used by the original percentage-only promos.
    discountPercent: { type: Number, min: 1, max: 100 },
    fixedAmount: { type: Number, min: 1 },
    maxDiscount: { type: Number, default: 500, min: 0 },
    minAmount: { type: Number, default: 0, min: 0 },
    expiresAt: Date,
    active: { type: Boolean, default: true },
    maxUses: { type: Number, min: 0 },
    usedCount: { type: Number, default: 0, min: 0 },
  },
  { timestamps: true, toJSON: jsonOptions },
);

export type PromoDoc = InferSchemaType<typeof promoSchema> & { _id: import('mongoose').Types.ObjectId };
export const Promo = model('Promo', promoSchema);
