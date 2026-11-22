import { randomUUID } from 'node:crypto';
import { Router } from 'express';
import mongoose from 'mongoose';
import { Seat } from '../../models/Seat.js';
import { SeatHold } from '../../models/SeatHold.js';
import { Screen } from '../../models/Screen.js';
import { Show } from '../../models/Show.js';
import { authenticate, optionalAuth } from '../../middleware/auth.js';
import { validate } from '../../middleware/validate.js';
import { asyncHandler, conflict, notFound, ok } from '../../lib/http.js';
import { env } from '../../config/env.js';
import { holdsSchema } from '../../lib/validators.js';

export const seatsRouter = Router({ mergeParams: true });

const isRaceError = (error: unknown): boolean =>
  typeof error === 'object' && error !== null && 'code' in error && [11000, 11001, 112].includes((error as { code: number }).code);

seatsRouter.get(
  '/seats',
  optionalAuth,
  asyncHandler(async (req, res) => {
    const show = await Show.findById(req.params.showId);
    if (!show) throw notFound('Show not found');

    const [seats, holds, screen] = await Promise.all([
      Seat.find({ screen: show.screen }).sort({ row: 1, number: 1 }),
      SeatHold.find({ show: show._id, expiresAt: { $gt: new Date() } }),
      Screen.findById(show.screen),
    ]);
    if (!screen) throw notFound('Screen not found');

    const holdBySeat = new Map(holds.map((hold) => [hold.seat, hold]));
    const priced = seats.map((seat) => {
      const hold = holdBySeat.get(seat.label);
      const status = !hold ? 'available' : hold.status === 'booked' ? 'booked' : 'held';
      return {
        label: seat.label,
        row: seat.row,
        number: seat.number,
        category: seat.category,
        price: show.pricing[seat.category as 'Regular' | 'Premium' | 'Recliner'] ?? seat.basePrice,
        status,
        mine: Boolean(hold && String(hold.user) === req.user?.sub),
      };
    });

    ok(res, {
      seats: priced,
      categories: screen.categories,
      available: priced.filter((s) => s.status === 'available').length,
      held: priced.filter((s) => s.status === 'held').length,
      booked: priced.filter((s) => s.status === 'booked').length,
      expiresIn: env.HOLD_TTL_SECONDS,
    });
  }),
);

// Atomic hold acquisition. A unique {show, seat} index plus conditional upserts
// (inside a transaction) guarantee exactly one caller can own a seat.
seatsRouter.post(
  '/holds',
  authenticate,
  validate(holdsSchema),
  asyncHandler(async (req, res) => {
    const { seats } = req.body as { seats: string[] };
    const showId = req.params.showId as string;
    if (!(await Show.exists({ _id: showId, status: 'scheduled' }))) throw notFound('Show not available');

    const show = await Show.findById(showId).select('screen');
    const validSeats = await Seat.find({ screen: show!.screen, label: { $in: seats } }).select('label');
    if (validSeats.length !== seats.length) throw conflict('One or more selected seats do not exist for this screen');

    const now = new Date();
    const expiresAt = new Date(now.getTime() + env.HOLD_TTL_SECONDS * 1000);
    const sessionId = randomUUID();
    const session = await mongoose.startSession();

    try {
      await session.withTransaction(async () => {
        for (const seat of seats) {
          await SeatHold.updateOne(
            {
              show: new mongoose.Types.ObjectId(showId),
              seat,
              $or: [
                { status: 'held', expiresAt: { $lte: now } },
                { status: 'held', user: new mongoose.Types.ObjectId(req.user!.sub) },
              ],
            },
            {
              $set: { status: 'held', user: new mongoose.Types.ObjectId(req.user!.sub), expiresAt, sessionId, booking: undefined },
              $setOnInsert: { show: new mongoose.Types.ObjectId(showId), seat },
            },
            { upsert: true, session },
          );
        }
      });
    } catch (error) {
      if (isRaceError(error)) throw conflict('One or more seats were just taken. Please refresh and choose again.');
      throw error;
    } finally {
      await session.endSession();
    }

    ok(res, { holds: seats, expiresAt: expiresAt.toISOString(), expiresIn: env.HOLD_TTL_SECONDS }, 'Seats held for you', 201);
  }),
);

seatsRouter.delete(
  '/holds',
  authenticate,
  asyncHandler(async (req, res) => {
    await SeatHold.deleteMany({ show: req.params.showId, user: req.user!.sub, status: 'held' });
    ok(res, { message: 'Seats released' }, 'Seats released');
  }),
);
