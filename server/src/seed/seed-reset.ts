/**
 * Safely removes ONLY demonstration/test data while preserving genuine users
 * and their bookings (and the shows those bookings depend on).
 *
 * Usage: npm run seed:reset && npm run seed
 */
import 'dotenv/config';
import mongoose from 'mongoose';
import { env } from '../config/env.js';
import { User } from '../models/User.js';
import { Movie } from '../models/Movie.js';
import { Theatre } from '../models/Theatre.js';
import { Screen } from '../models/Screen.js';
import { Seat } from '../models/Seat.js';
import { Show } from '../models/Show.js';
import { Promo } from '../models/Promo.js';
import { SeatHold } from '../models/SeatHold.js';
import { Booking } from '../models/Booking.js';
import { Payment } from '../models/Payment.js';

const run = async () => {
  await mongoose.connect(env.MONGODB_URI, { serverSelectionTimeoutMS: 10_000 });
  console.log(`Resetting demonstration data in ${env.MONGODB_URI.replace(/\/\/[^@]+@/, '//***@')}`);

  const demoUsers = await User.find({
    $or: [
      { email: { $in: ['admin@cinebook.demo', 'customer@cinebook.demo', 'priya@cinebook.demo', 'arjun@cinebook.demo'] } },
      { email: { $regex: '@example\\.com$' } },
      { seeded: true },
    ],
  }).select('_id');
  const demoIds = demoUsers.map((u) => u._id);

  const removedPayments = await Payment.deleteMany({ $or: [{ seeded: true }, { user: { $in: demoIds } }] });
  const removedHolds = await SeatHold.deleteMany({ $or: [{ seeded: true }, { user: { $in: demoIds } }] });
  const removedBookings = await Booking.deleteMany({ $or: [{ seeded: true }, { user: { $in: demoIds } }, { code: /^CBSIM/ }] });

  // Keep any show referenced by a genuine booking that survived.
  const survivingBookings = await Booking.find().select('show');
  const keepShows = survivingBookings.map((b) => b.show);
  const removedShows = await Show.deleteMany({ _id: { $nin: keepShows } });

  const survivingShows = await Show.find().select('movie theatre screen');
  const keepMovies = survivingShows.map((s) => s.movie);
  const keepTheatres = survivingShows.map((s) => s.theatre);
  const keepScreens = survivingShows.map((s) => s.screen);
  const removedMovies = await Movie.deleteMany({ _id: { $nin: keepMovies } });
  const removedTheatres = await Theatre.deleteMany({ _id: { $nin: keepTheatres } });
  const removedScreens = await Screen.deleteMany({ _id: { $nin: keepScreens } });
  const removedSeats = await Seat.deleteMany({ screen: { $nin: keepScreens } });
  const removedPromos = await Promo.deleteMany({});
  const removedUsers = await User.deleteMany({ _id: { $in: demoIds } });

  console.log('Removed demo data:', JSON.stringify({
    users: removedUsers.deletedCount, movies: removedMovies.deletedCount, theatres: removedTheatres.deletedCount,
    screens: removedScreens.deletedCount, seats: removedSeats.deletedCount, shows: removedShows.deletedCount,
    bookings: removedBookings.deletedCount, payments: removedPayments.deletedCount,
    seatHolds: removedHolds.deletedCount, promos: removedPromos.deletedCount,
  }));
  console.log('Genuine users and their bookings were preserved. Run `npm run seed` to repopulate the demo.');
  await mongoose.disconnect();
};

run().catch(async (error) => {
  console.error('Reset failed:', error);
  await mongoose.disconnect();
  process.exit(1);
});
