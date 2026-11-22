import { Schema, model, type InferSchemaType } from 'mongoose';
import { jsonOptions } from './base.js';

const movieSchema = new Schema(
  {
    title: { type: String, required: true, trim: true, maxlength: 160 },
    description: { type: String, required: true, trim: true, maxlength: 4000 },
    genre: { type: [String], default: [], index: true },
    language: { type: String, default: 'English', index: true },
    format: { type: [String], default: ['2D'], index: true },
    duration: { type: Number, min: 1, required: true },
    releaseDate: { type: Date, required: true },
    certificate: { type: String, default: 'UA' },
    rating: { type: Number, min: 0, max: 10, default: 0 },
    cast: { type: [String], default: [] },
    poster: { type: String, required: true },
    backdrop: String,
    trailerUrl: String,
    status: { type: String, enum: ['showing', 'upcoming'], default: 'showing', index: true },
    featured: { type: Boolean, default: false, index: true },
    trending: { type: Boolean, default: false, index: true },
  },
  { timestamps: true, toJSON: jsonOptions },
);

// Search uses escaped regex predicates in the route. A MongoDB text index is
// deliberately avoided here: a document field literally named `language` is
// interpreted by MongoDB as a text-index language override ("Hindi" is not a
// supported override and makes inserts fail).
movieSchema.index({ status: 1, featured: -1, releaseDate: -1 });

export type MovieDoc = InferSchemaType<typeof movieSchema> & { _id: import('mongoose').Types.ObjectId };
export const Movie = model('Movie', movieSchema);
