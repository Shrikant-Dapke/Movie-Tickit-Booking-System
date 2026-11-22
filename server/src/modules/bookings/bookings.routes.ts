import { Router } from 'express';
import { z } from 'zod';
import { Booking } from '../../models/Booking.js';
import { authenticate } from '../../middleware/auth.js';
import { validate } from '../../middleware/validate.js';
import { asyncHandler, notFound, ok } from '../../lib/http.js';
import { bookingSchema, objectId, paySchema } from '../../lib/validators.js';
import { cancelBooking, createBooking, payBooking } from '../../services/booking.service.js';
import { buildTicket } from '../../lib/ticket.js';

export const bookingsRouter = Router();

const withDetails = <T>(query: T): T =>
  (query as any)
    .populate({ path: 'show', populate: [{ path: 'movie' }, { path: 'theatre' }, { path: 'screen' }] })
    .populate('payment') as T;

bookingsRouter.post(
  '/',
  authenticate,
  validate(bookingSchema),
  asyncHandler(async (req, res) => {
    const { showId, seats, promoCode } = req.body;
    const booking = await createBooking(req.user!.sub, showId, seats, promoCode);
    ok(
      res,
      {
        ...booking.toJSON(),
        paymentSummary: { amount: booking.amount, discount: booking.discount, total: booking.total, seats: booking.seats },
      },
      'Booking created — complete the simulated payment to confirm',
      201,
    );
  }),
);

bookingsRouter.post(
  '/:id/pay',
  authenticate,
  validate(z.object({ id: objectId }), 'params'),
  validate(paySchema),
  asyncHandler(async (req, res) => {
    const { method, outcome } = req.body;
    const result = await payBooking(req.user!.sub, req.params.id, method, outcome);
    ok(res, result, 'Payment successful — your booking is confirmed');
  }),
);

bookingsRouter.get(
  '/mine',
  authenticate,
  asyncHandler(async (req, res) => {
    const bookings = await withDetails(Booking.find({ user: req.user!.sub })).sort({ createdAt: -1 });
    ok(res, bookings);
  }),
);

bookingsRouter.get(
  '/:id',
  authenticate,
  validate(z.object({ id: objectId }), 'params'),
  asyncHandler(async (req, res) => {
    const booking = await withDetails(Booking.findOne({ _id: req.params.id, user: req.user!.sub }));
    if (!booking) throw notFound('Booking not found');
    ok(res, booking);
  }),
);

bookingsRouter.get(
  '/:id/ticket',
  authenticate,
  validate(z.object({ id: objectId }), 'params'),
  asyncHandler(async (req, res) => {
    const booking = await withDetails(Booking.findOne({ _id: req.params.id, user: req.user!.sub }));
    if (!booking) throw notFound('Booking not found');
    if (booking.status !== 'confirmed') throw notFound('Ticket is only available for confirmed bookings');
    ok(res, { booking, ...(await buildTicket(booking.toJSON())) });
  }),
);

bookingsRouter.delete(
  '/:id',
  authenticate,
  validate(z.object({ id: objectId }), 'params'),
  asyncHandler(async (req, res) => {
    ok(res, await cancelBooking(req.user!.sub, req.params.id), 'Booking cancelled');
  }),
);
