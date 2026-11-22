import { Schema, model, type InferSchemaType } from 'mongoose';
import { jsonOptions } from './base.js';

const theatreSchema = new Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: 120 },
    city: { type: String, required: true, trim: true, index: true },
    address: { type: String, required: true, trim: true },
    phone: String,
    amenities: { type: [String], default: [] },
  },
  { timestamps: true, toJSON: jsonOptions },
);

theatreSchema.index({ city: 1, name: 1 }, { unique: true });

export type TheatreDoc = InferSchemaType<typeof theatreSchema> & { _id: import('mongoose').Types.ObjectId };
export const Theatre = model('Theatre', theatreSchema);
