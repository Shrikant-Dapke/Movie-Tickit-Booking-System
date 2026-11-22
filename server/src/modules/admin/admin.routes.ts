import { Router } from 'express';
import { z } from 'zod';
import { Booking } from '../../models/Booking.js';
import { Movie } from '../../models/Movie.js';
import { Payment } from '../../models/Payment.js';
import { Show } from '../../models/Show.js';
import { Theatre } from '../../models/Theatre.js';
import { User } from '../../models/User.js';
import { authenticate, requireAdmin } from '../../middleware/auth.js';
import { validate } from '../../middleware/validate.js';
import { asyncHandler, notFound, ok } from '../../lib/http.js';
import { bookingQuerySchema, objectId } from '../../lib/validators.js';

export const adminRouter = Router();
adminRouter.use(authenticate, requireAdmin);

const withDetails = <T>(query: T): T =>
  (query as any)
    .populate({ path: 'show', populate: [{ path: 'movie' }, { path: 'theatre' }, { path: 'screen' }] })
    .populate('user')
    .populate('payment') as T;

adminRouter.get(
  '/overview',
  asyncHandler(async (_req, res) => {
    const [customers, movies, theatres, shows, bookings, revenue, byStatus, recentBookings] = await Promise.all([
      User.countDocuments({ role: 'customer' }),
      Movie.countDocuments(),
      Theatre.countDocuments(),
      Show.countDocuments(),
      Booking.countDocuments({ status: 'confirmed' }),
      Payment.aggregate([{ $match: { status: 'succeeded' } }, { $group: { _id: null, total: { $sum: '$amount' } } }]),
      Booking.aggregate([{ $group: { _id: '$status', count: { $sum: 1 } } }]),
      withDetails(Booking.find().sort({ createdAt: -1 }).limit(6)),
    ]);
    ok(res, {
      customers,
      movies,
      theatres,
      shows,
      bookings,
      revenue: revenue[0]?.total ?? 0,
      byStatus: Object.fromEntries(byStatus.map((row) => [row._id, row.count])),
      recentBookings,
    });
  }),
);

adminRouter.get(
  '/bookings',
  validate(bookingQuerySchema, 'query'),
  asyncHandler(async (req, res) => {
    const { status, search } = req.query as Record<string, string | undefined>;
    const filter: Record<string, unknown> = {};
    if (status) filter.status = status;
    const bookings = await withDetails(Booking.find(filter)).sort({ createdAt: -1 });
    const result = search
      ? bookings.filter((booking: any) =>
          [booking.code, booking.show?.movie?.title, booking.show?.theatre?.name, booking.user]
            .join(' ')
            .toLowerCase()
            .includes(search.toLowerCase()),
        )
      : bookings;
    ok(res, result);
  }),
);

adminRouter.patch(
  '/bookings/:id',
  validate(z.object({ id: objectId }), 'params'),
  asyncHandler(async (req, res) => {
    const status = z.enum(['confirmed', 'cancelled', 'failed']).parse(req.body.status);
    const booking = await Booking.findById(req.params.id);
    if (!booking) throw notFound('Booking not found');
    booking.status = status;
    await booking.save();
    ok(res, booking, 'Booking updated');
  }),
);

adminRouter.get(
  '/users',
  asyncHandler(async (_req, res) => ok(res, await User.find({ role: 'customer' }).sort({ createdAt: -1 }))),
);
