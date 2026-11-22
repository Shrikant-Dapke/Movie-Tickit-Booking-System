import { Schema, model, type InferSchemaType } from 'mongoose';
import { jsonOptions } from './base.js';

const paymentSchema = new Schema(
  {
    booking: { type: Schema.Types.ObjectId, ref: 'Booking', required: true, index: true },
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    method: { type: String, enum: ['card', 'upi', 'netbanking'], required: true },
    amount: { type: Number, required: true, min: 0 },
    status: { type: String, enum: ['succeeded', 'failed', 'refunded'], required: true },
    transactionId: { type: String, required: true, unique: true },
    failureReason: String,
    simulated: { type: Boolean, default: true },
  },
  { timestamps: true, toJSON: jsonOptions },
);

export type PaymentDoc = InferSchemaType<typeof paymentSchema> & { _id: import('mongoose').Types.ObjectId };
export const Payment = model('Payment', paymentSchema);
