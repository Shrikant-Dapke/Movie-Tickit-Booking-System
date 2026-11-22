import { Schema, model, type InferSchemaType } from 'mongoose';
import { jsonOptions } from './base.js';

const bookedSeatSchema = new Schema(
  {
    label: { type: String, required: true },
    category: { type: String, required: true },
    price: { type: Number, required: true, min: 0 },
  },
  { _id: false },
);

const bookingSchema = new Schema(
  {
    code: { type: String, required: true, unique: true },
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    show: { type: Schema.Types.ObjectId, ref: 'Show', required: true, index: true },
    seats: { type: [bookedSeatSchema], required: true },
    amount: { type: Number, required: true, min: 0 },
    discount: { type: Number, default: 0, min: 0 },
    total: { type: Number, required: true, min: 0 },
    promoCode: String,
    status: { type: String, enum: ['pending', 'confirmed', 'failed', 'cancelled'], default: 'pending', index: true },
    paymentStatus: { type: String, enum: ['unpaid', 'paid', 'failed', 'refunded'], default: 'unpaid', index: true },
    payment: { type: Schema.Types.ObjectId, ref: 'Payment' },
  },
  { timestamps: true, toJSON: jsonOptions },
);

bookingSchema.index({ user: 1, createdAt: -1 });
bookingSchema.index({ createdAt: -1 });

export type BookingDoc = InferSchemaType<typeof bookingSchema> & { _id: import('mongoose').Types.ObjectId };
export const Booking = model('Booking', bookingSchema);
