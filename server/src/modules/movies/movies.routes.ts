import { Router } from 'express';
import type { FilterQuery } from 'mongoose';
import { Movie, type MovieDoc } from '../../models/Movie.js';
import { authenticate, requireAdmin } from '../../middleware/auth.js';
import { validate } from '../../middleware/validate.js';
import { asyncHandler, notFound, ok } from '../../lib/http.js';
import { movieQuerySchema, movieSchema, objectId } from '../../lib/validators.js';

export const moviesRouter = Router();
const escapeRegex = (value: string) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

moviesRouter.get(
  '/',
  validate(movieQuerySchema, 'query'),
  asyncHandler(async (req, res) => {
    const { search, genre, language, format, status, featured } = req.query as Record<string, string | undefined>;
    const filter: FilterQuery<MovieDoc> = {};
    if (search) {
      const rx = new RegExp(escapeRegex(search), 'i');
      filter.$or = [{ title: rx }, { genre: rx }, { cast: rx }];
    }
    if (genre) filter.genre = genre;
    if (language) filter.language = language;
    if (format) filter.format = format;
    if (status) filter.status = status;
    if (featured) filter.featured = featured === 'true';

    const movies = await Movie.find(filter).sort({ featured: -1, trending: -1, releaseDate: -1, title: 1 });
    // A legacy catalogue record may still exist because a genuine booking
    // references it. Hide duplicates by title, preferring the seeded record.
    const quality = (movie: (typeof movies)[number]) =>
      Number(movie.seeded === true) + Number(!!movie.director) + Number(!!movie.synopsis) + Number((movie.popularity ?? 0) > 0);
    const byTitle = new Map<string, (typeof movies)[number]>();
    for (const movie of movies) {
      const key = movie.title.trim().toLowerCase();
      const existing = byTitle.get(key);
      // Prefer the richer seeded record so customers see the new metadata
      // (director, synopsis, wide backdrop, popularity).
      if (!existing || quality(movie) > quality(existing)) byTitle.set(key, movie);
    }
    ok(res, [...byTitle.values()]);
  }),
);

moviesRouter.get(
  '/:id',
  validate(z.object({ id: objectId }), 'params'),
  asyncHandler(async (req, res) => {
    const movie = await Movie.findById(req.params.id);
    if (!movie) throw notFound('Movie not found');
    ok(res, movie);
  }),
);

moviesRouter.post(
  '/',
  authenticate,
  requireAdmin,
  validate(movieSchema),
  asyncHandler(async (req, res) => ok(res, await Movie.create(req.body), 'Movie created', 201)),
);

moviesRouter.patch(
  '/:id',
  authenticate,
  requireAdmin,
  validate(z.object({ id: objectId }), 'params'),
  validate(movieSchema.partial()),
  asyncHandler(async (req, res) => {
    const movie = await Movie.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!movie) throw notFound('Movie not found');
    ok(res, movie, 'Movie updated');
  }),
);

moviesRouter.delete(
  '/:id',
  authenticate,
  requireAdmin,
  validate(z.object({ id: objectId }), 'params'),
  asyncHandler(async (req, res) => {
    const movie = await Movie.findByIdAndDelete(req.params.id);
    if (!movie) throw notFound('Movie not found');
    ok(res, { message: 'Movie deleted' }, 'Movie deleted');
  }),
);

// Imported at the bottom to keep the route table above readable.
import { z } from 'zod';
