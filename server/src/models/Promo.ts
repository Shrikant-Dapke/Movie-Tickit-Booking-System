import { Schema, model, type InferSchemaType } from 'mongoose';
import { jsonOptions } from './base.js';

const promoSchema = new Schema(
  {
    code: { type: String, required: true, unique: true, uppercase: true, trim: true },
    description: String,
    discountPercent: { type: Number, required: true, min: 1, max: 100 },
    maxDiscount: { type: Number, default: 500, min: 0 },
    minAmount: { type: Number, default: 0, min: 0 },
    expiresAt: Date,
    active: { type: Boolean, default: true },
  },
  { timestamps: true, toJSON: jsonOptions },
);

export type PromoDoc = InferSchemaType<typeof promoSchema> & { _id: import('mongoose').Types.ObjectId };
export const Promo = model('Promo', promoSchema);
