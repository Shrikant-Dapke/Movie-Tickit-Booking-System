import { Schema, model, type InferSchemaType } from 'mongoose';
import { jsonOptions } from './base.js';

const pricingSchema = new Schema(
  {
    Regular: { type: Number, required: true, min: 1 },
    Premium: { type: Number, required: true, min: 1 },
    Recliner: { type: Number, required: true, min: 1 },
  },
  { _id: false },
);

const showSchema = new Schema(
  {
    movie: { type: Schema.Types.ObjectId, ref: 'Movie', required: true, index: true },
    theatre: { type: Schema.Types.ObjectId, ref: 'Theatre', required: true, index: true },
    screen: { type: Schema.Types.ObjectId, ref: 'Screen', required: true },
    date: { type: String, required: true, index: true },
    time: { type: String, required: true },
    format: { type: String, enum: ['2D', '3D', 'IMAX'], default: '2D' },
    pricing: { type: pricingSchema, required: true },
    status: { type: String, enum: ['scheduled', 'cancelled'], default: 'scheduled', index: true },
  },
  { timestamps: true, toJSON: jsonOptions },
);

showSchema.index({ movie: 1, date: 1, status: 1 });
showSchema.index({ theatre: 1, date: 1, time: 1 });

export type ShowDoc = InferSchemaType<typeof showSchema> & { _id: import('mongoose').Types.ObjectId };
export const Show = model('Show', showSchema);
