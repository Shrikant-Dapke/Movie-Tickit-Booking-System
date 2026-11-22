import { Router } from 'express';
import type { FilterQuery } from 'mongoose';
import { z } from 'zod';
import { Show, type ShowDoc } from '../../models/Show.js';
import { Movie } from '../../models/Movie.js';
import { Theatre } from '../../models/Theatre.js';
import { Screen } from '../../models/Screen.js';
import { authenticate, requireAdmin } from '../../middleware/auth.js';
import { validate } from '../../middleware/validate.js';
import { asyncHandler, badRequest, notFound, ok } from '../../lib/http.js';
import { objectId, showQuerySchema, showSchema } from '../../lib/validators.js';
import { seatsRouter } from '../seats/seats.routes.js';

export const showsRouter = Router();

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const populateShow = (query: any) => query.populate('movie').populate('theatre').populate('screen');

showsRouter.get(
  '/',
  validate(showQuerySchema, 'query'),
  asyncHandler(async (req, res) => {
    const { movie, theatre, city, date, format, status } = req.query as Record<string, string | undefined>;
    const filter: FilterQuery<ShowDoc> = { status: status ?? 'scheduled' };
    if (movie) filter.movie = movie;
    if (theatre) filter.theatre = theatre;
    if (date) filter.date = date;
    if (format) filter.format = format;
    if (city) {
      const theatres = await Theatre.find({ city: new RegExp(`^${city.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i') }).select('_id');
      filter.theatre = { $in: theatres.map((t) => t._id) };
    }
    const shows = await populateShow(Show.find(filter)).sort({ date: 1, time: 1 });
    // Hide shows that have already started; they cannot be booked.
    const now = Date.now();
    ok(res, shows.filter((show: any) => new Date(`${show.date}T${show.time}:00`).getTime() > now));
  }),
);

showsRouter.get(
  '/:id',
  validate(z.object({ id: objectId }), 'params'),
  asyncHandler(async (req, res) => {
    const show = await populateShow(Show.findById(req.params.id));
    if (!show) throw notFound('Show not found');
    ok(res, show);
  }),
);

showsRouter.post(
  '/',
  authenticate,
  requireAdmin,
  validate(showSchema),
  asyncHandler(async (req, res) => {
    const { movie, theatre, screen } = req.body;
    if (!(await Movie.exists({ _id: movie }))) throw badRequest('Movie does not exist');
    if (!(await Theatre.exists({ _id: theatre }))) throw badRequest('Theatre does not exist');
    const screenDoc = await Screen.findById(screen);
    if (!screenDoc || String(screenDoc.theatre) !== String(theatre)) throw badRequest('Screen does not belong to this theatre');
    const show = await Show.create(req.body);
    ok(res, await populateShow(Show.findById(show._id)), 'Show scheduled', 201);
  }),
);

showsRouter.patch(
  '/:id',
  authenticate,
  requireAdmin,
  validate(z.object({ id: objectId }), 'params'),
  validate(showSchema.partial()),
  asyncHandler(async (req, res) => {
    const show = await Show.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!show) throw notFound('Show not found');
    ok(res, await populateShow(Show.findById(show._id)), 'Show updated');
  }),
);

showsRouter.delete(
  '/:id',
  authenticate,
  requireAdmin,
  validate(z.object({ id: objectId }), 'params'),
  asyncHandler(async (req, res) => {
    const show = await Show.findByIdAndUpdate(req.params.id, { status: 'cancelled' }, { new: true });
    if (!show) throw notFound('Show not found');
    ok(res, { message: 'Show cancelled' }, 'Show cancelled');
  }),
);

showsRouter.use('/:showId', validate(z.object({ showId: objectId }), 'params'), seatsRouter);
