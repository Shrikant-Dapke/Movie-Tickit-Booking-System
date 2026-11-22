import { Schema, model, type InferSchemaType } from 'mongoose';
import { jsonOptions } from './base.js';

const seatHoldSchema = new Schema(
  {
    show: { type: Schema.Types.ObjectId, ref: 'Show', required: true },
    seat: { type: String, required: true },
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    sessionId: String,
    status: { type: String, enum: ['held', 'booked'], default: 'held', index: true },
    booking: { type: Schema.Types.ObjectId, ref: 'Booking' },
    expiresAt: { type: Date, required: true },
  },
  { timestamps: true, toJSON: jsonOptions },
);

// One authoritative state per seat per show. This unique index is the core of
// double-booking prevention: competing upserts race, exactly one wins.
seatHoldSchema.index({ show: 1, seat: 1 }, { unique: true });
// TTL only clears abandoned (held) reservations; booked seats are permanent.
seatHoldSchema.index(
  { expiresAt: 1 },
  { expireAfterSeconds: 0, partialFilterExpression: { status: 'held' } },
);
seatHoldSchema.index({ user: 1, show: 1 });

export type SeatHoldDoc = InferSchemaType<typeof seatHoldSchema> & { _id: import('mongoose').Types.ObjectId };
export const SeatHold = model('SeatHold', seatHoldSchema);
