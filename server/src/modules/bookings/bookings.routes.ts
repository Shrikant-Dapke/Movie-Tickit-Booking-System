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

// Dedicated customer dashboard data — every metric comes from this customer's
// own MongoDB bookings, never from client state or hardcoded values.
bookingsRouter.get(
  '/summary',
  authenticate,
  asyncHandler(async (req, res) => {
    const bookings = await withDetails(Booking.find({ user: req.user!.sub })).sort({ createdAt: -1 });
    const now = Date.now();
    const showTime = (booking: any) => {
      const date = booking.show?.date;
      const time = booking.show?.time;
      return date && time ? new Date(`${date}T${time}:00`).getTime() : 0;
    };

    const upcoming = bookings.filter(
      (booking: any) => booking.status === 'confirmed' && showTime(booking) > now,
    );
    const completed = bookings.filter(
      (booking: any) => booking.status === 'confirmed' && showTime(booking) > 0 && showTime(booking) <= now,
    );
    const moviesWatched = new Set(
      completed.map((booking: any) => String(booking.show?.movie?._id ?? booking.show?.movie ?? booking.id)),
    ).size;
    const totalSpent = bookings
      .filter((booking: any) => booking.paymentStatus === 'paid' && !['cancelled', 'failed'].includes(booking.status))
      .reduce((sum: number, booking: any) => sum + Number(booking.total ?? 0), 0);
    const nextUpcoming = [...upcoming].sort((a: any, b: any) => showTime(a) - showTime(b))[0] ?? null;

    ok(res, {
      totalBookings: bookings.length,
      upcomingBookings: upcoming.length,
      completedBookings: completed.length,
      moviesWatched,
      totalSpent,
      nextUpcoming,
      recentActivity: bookings.slice(0, 5).map((booking: any) => ({
        id: booking.id,
        code: booking.code,
        movie: booking.show?.movie?.title ?? 'Movie',
        poster: booking.show?.movie?.poster ?? null,
        bookingDate: booking.createdAt,
        showDate: booking.show?.date ?? null,
        showTime: booking.show?.time ?? null,
        status: booking.status,
        paymentStatus: booking.paymentStatus,
        amount: booking.total,
      })),
    });
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
