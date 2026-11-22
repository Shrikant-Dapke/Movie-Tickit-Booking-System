import { Router } from 'express';
import { z } from 'zod';
import { Screen } from '../../models/Screen.js';
import { Seat } from '../../models/Seat.js';
import { Show } from '../../models/Show.js';
import { Theatre } from '../../models/Theatre.js';
import { authenticate, requireAdmin } from '../../middleware/auth.js';
import { validate } from '../../middleware/validate.js';
import { asyncHandler, badRequest, conflict, notFound, ok } from '../../lib/http.js';
import { objectId, screenBaseSchema, screenSchema } from '../../lib/validators.js';

export const screensRouter = Router();
export const theatreScreensRouter = Router({ mergeParams: true });

const buildSeats = (screenId: string, rows: number, seatsPerRow: number, categories: { name: 'Regular' | 'Premium' | 'Recliner'; startRow: number; endRow: number; basePrice: number }[]) =>
  Array.from({ length: rows }, (_, r) =>
    Array.from({ length: seatsPerRow }, (_, c) => {
      const category = categories.find((cat) => r >= cat.startRow && r <= cat.endRow) ?? categories[0];
      return {
        screen: screenId,
        label: `${String.fromCharCode(65 + r)}${c + 1}`,
        row: String.fromCharCode(65 + r),
        number: c + 1,
        category: category.name,
        basePrice: category.basePrice,
      };
    }),
  ).flat();

theatreScreensRouter.get(
  '/',
  validate(z.object({ theatreId: objectId }), 'params'),
  asyncHandler(async (req, res) => ok(res, await Screen.find({ theatre: req.params.theatreId }).sort({ name: 1 }))),
);

screensRouter.get(
  '/:id',
  validate(z.object({ id: objectId }), 'params'),
  asyncHandler(async (req, res) => {
    const screen = await Screen.findById(req.params.id).populate('theatre');
    if (!screen) throw notFound('Screen not found');
    const seats = await Seat.find({ screen: screen._id }).sort({ row: 1, number: 1 });
    ok(res, { ...screen.toJSON(), seats });
  }),
);

theatreScreensRouter.post(
  '/',
  authenticate,
  requireAdmin,
  validate(z.object({ theatreId: objectId }), 'params'),
  validate(screenSchema),
  asyncHandler(async (req, res) => {
    if (!(await Theatre.exists({ _id: req.params.theatreId }))) throw notFound('Theatre not found');
    const screen = await Screen.create({ ...req.body, theatre: req.params.theatreId });
    await Seat.insertMany(buildSeats(String(screen._id), screen.rows, screen.seatsPerRow, screen.categories.toObject()));
    ok(res, screen, 'Screen created with seating layout', 201);
  }),
);

screensRouter.patch(
  '/:id',
  authenticate,
  requireAdmin,
  validate(z.object({ id: objectId }), 'params'),
  validate(screenBaseSchema.partial()),
  asyncHandler(async (req, res) => {
    const screen = await Screen.findById(req.params.id);
    if (!screen) throw notFound('Screen not found');
    const rows = req.body.rows ?? screen.rows;
    const seatsPerRow = req.body.seatsPerRow ?? screen.seatsPerRow;
    const categories = req.body.categories ?? screen.categories.toObject();
    if (await Show.exists({ screen: screen._id })) throw conflict('Cannot change the layout of a screen with scheduled shows');
    await Seat.deleteMany({ screen: screen._id });
    await Seat.insertMany(buildSeats(String(screen._id), rows, seatsPerRow, categories));
    const updated = await Screen.findByIdAndUpdate(screen._id, req.body, { new: true, runValidators: true });
    ok(res, updated, 'Screen and seating layout updated');
  }),
);

screensRouter.delete(
  '/:id',
  authenticate,
  requireAdmin,
  validate(z.object({ id: objectId }), 'params'),
  asyncHandler(async (req, res) => {
    if (await Show.exists({ screen: req.params.id })) throw conflict('Remove this screen’s shows before deleting it');
    await Seat.deleteMany({ screen: req.params.id });
    const screen = await Screen.findByIdAndDelete(req.params.id);
    if (!screen) throw notFound('Screen not found');
    ok(res, { message: 'Screen deleted' }, 'Screen deleted');
  }),
);
