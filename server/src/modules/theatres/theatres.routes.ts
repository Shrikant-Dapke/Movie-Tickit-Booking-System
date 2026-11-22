import { Router } from 'express';
import { z } from 'zod';
import { Theatre } from '../../models/Theatre.js';
import { Screen } from '../../models/Screen.js';
import { authenticate, requireAdmin } from '../../middleware/auth.js';
import { validate } from '../../middleware/validate.js';
import { asyncHandler, conflict, notFound, ok } from '../../lib/http.js';
import { objectId, theatreSchema } from '../../lib/validators.js';

export const theatresRouter = Router();

theatresRouter.get(
  '/',
  asyncHandler(async (req, res) => {
    const city = typeof req.query.city === 'string' ? req.query.city : undefined;
    const filter = city ? { city: new RegExp(`^${city.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i') } : {};
    ok(res, await Theatre.find(filter).sort({ city: 1, name: 1 }));
  }),
);

theatresRouter.get(
  '/:id',
  validate(z.object({ id: objectId }), 'params'),
  asyncHandler(async (req, res) => {
    const theatre = await Theatre.findById(req.params.id);
    if (!theatre) throw notFound('Theatre not found');
    const screens = await Screen.find({ theatre: theatre._id });
    ok(res, { ...theatre.toJSON(), screens });
  }),
);

theatresRouter.post(
  '/',
  authenticate,
  requireAdmin,
  validate(theatreSchema),
  asyncHandler(async (req, res) => ok(res, await Theatre.create(req.body), 'Theatre created', 201)),
);

theatresRouter.patch(
  '/:id',
  authenticate,
  requireAdmin,
  validate(z.object({ id: objectId }), 'params'),
  validate(theatreSchema.partial()),
  asyncHandler(async (req, res) => {
    const theatre = await Theatre.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!theatre) throw notFound('Theatre not found');
    ok(res, theatre, 'Theatre updated');
  }),
);

theatresRouter.delete(
  '/:id',
  authenticate,
  requireAdmin,
  validate(z.object({ id: objectId }), 'params'),
  asyncHandler(async (req, res) => {
    const screenCount = await Screen.countDocuments({ theatre: req.params.id });
    if (screenCount) throw conflict('Remove this theatre’s screens before deleting it');
    const theatre = await Theatre.findByIdAndDelete(req.params.id);
    if (!theatre) throw notFound('Theatre not found');
    ok(res, { message: 'Theatre deleted' }, 'Theatre deleted');
  }),
);
