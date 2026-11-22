import { Schema, model, type InferSchemaType } from 'mongoose';
import { jsonOptions } from './base.js';

const seatSchema = new Schema(
  {
    screen: { type: Schema.Types.ObjectId, ref: 'Screen', required: true, index: true },
    label: { type: String, required: true },
    row: { type: String, required: true },
    number: { type: Number, required: true },
    category: { type: String, enum: ['Regular', 'Premium', 'Recliner'], required: true },
    basePrice: { type: Number, required: true, min: 1 },
  },
  { timestamps: true, toJSON: jsonOptions },
);

seatSchema.index({ screen: 1, label: 1 }, { unique: true });

export type SeatDoc = InferSchemaType<typeof seatSchema> & { _id: import('mongoose').Types.ObjectId };
export const Seat = model('Seat', seatSchema);
