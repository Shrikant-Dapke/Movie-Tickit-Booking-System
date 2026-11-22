import { Schema, model, type InferSchemaType } from 'mongoose';
import { jsonOptions } from './base.js';

const categorySchema = new Schema(
  {
    name: { type: String, required: true, enum: ['Regular', 'Premium', 'Recliner'] },
    startRow: { type: Number, required: true, min: 0 },
    endRow: { type: Number, required: true, min: 0 },
    basePrice: { type: Number, required: true, min: 1 },
    color: { type: String, default: '#64748b' },
  },
  { _id: false },
);

const screenSchema = new Schema(
  {
    theatre: { type: Schema.Types.ObjectId, ref: 'Theatre', required: true, index: true },
    name: { type: String, required: true, trim: true },
    format: { type: String, enum: ['2D', '3D', 'IMAX'], default: '2D' },
    rows: { type: Number, required: true, min: 1, max: 26 },
    seatsPerRow: { type: Number, required: true, min: 1, max: 30 },
    categories: { type: [categorySchema], required: true },
  },
  { timestamps: true, toJSON: jsonOptions },
);

screenSchema.index({ theatre: 1, name: 1 }, { unique: true });

export type ScreenDoc = InferSchemaType<typeof screenSchema> & { _id: import('mongoose').Types.ObjectId };
export const Screen = model('Screen', screenSchema);
