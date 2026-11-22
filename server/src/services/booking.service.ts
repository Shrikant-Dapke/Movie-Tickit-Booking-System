import { randomBytes } from 'node:crypto';
import mongoose, { type ClientSession } from 'mongoose';
import { Booking } from '../models/Booking.js';
import { Payment } from '../models/Payment.js';
import { Promo } from '../models/Promo.js';
import { Seat } from '../models/Seat.js';
import { SeatHold } from '../models/SeatHold.js';
import { Show } from '../models/Show.js';
import { badRequest, conflict, notFound, paymentFailed } from '../lib/http.js';
import { env } from '../config/env.js';

const isRaceError = (error: unknown): boolean =>
  typeof error === 'object' && error !== null && 'code' in error && [11000, 11001, 112].includes((error as { code: number }).code);

const generateCode = async (): Promise<string> => {
  for (let attempt = 0; attempt < 5; attempt += 1) {
    const code = `CB${randomBytes(5).toString('hex').toUpperCase()}`;
    if (!(await Booking.exists({ code }))) return code;
  }
  throw new Error('Unable to generate a unique booking code');
};

const computePricing = async (showId: string, seats: string[], promoCode?: string) => {
  const show = await Show.findById(showId);
  if (!show) throw notFound('Show not found');
  if (show.status !== 'scheduled') throw badRequest('This show has been cancelled');
  if (new Date(`${show.date}T${show.time}:00`) <= new Date()) throw badRequest('This show has already started');

  const seatDocs = await Seat.find({ screen: show.screen, label: { $in: seats } });
  if (seatDocs.length !== seats.length) throw badRequest('One or more selected seats are invalid for this show');
  const byLabel = new Map(seatDocs.map((seat) => [seat.label, seat]));
  const lines = seats.map((label) => {
    const seat = byLabel.get(label)!;
    const category = seat.category as 'Regular' | 'Premium' | 'Recliner';
    return { label: seat.label, category, price: show.pricing[category] ?? seat.basePrice };
  });
  const amount = lines.reduce((sum, line) => sum + line.price, 0);

  let discount = 0;
  if (promoCode) {
    const promo = await Promo.findOne({ code: promoCode.toUpperCase(), active: true });
    if (!promo || (promo.expiresAt && promo.expiresAt.getTime() < Date.now())) throw badRequest('This promo code is invalid or expired');
    if (amount < promo.minAmount) throw badRequest(`This code requires a minimum booking of ₹${promo.minAmount}`);
    discount = Math.min(Math.round((amount * promo.discountPercent) / 100), promo.maxDiscount);
  }

  return { show, lines, amount, discount, total: Math.max(0, amount - discount), promoCode: promoCode?.toUpperCase() };
};

export const verifyHolds = async (userId: string, showId: string, seats: string[], session?: ClientSession) => {
  const active = await SeatHold.find(
    { show: showId, seat: { $in: seats }, user: userId, status: 'held', expiresAt: { $gt: new Date() } },
    null,
    { session },
  );
  if (active.length !== seats.length || new Set(active.map((h) => h.seat)).size !== seats.length) {
    throw conflict('Your seat hold has expired or changed. Please select your seats again.');
  }
  return active;
};

export const createBooking = async (userId: string, showId: string, seats: string[], promoCode?: string) => {
  const pricing = await computePricing(showId, seats, promoCode);
  await verifyHolds(userId, showId, seats);

  const session = await mongoose.startSession();
  try {
    let created!: InstanceType<typeof Booking>;
    await session.withTransaction(async () => {
      await verifyHolds(userId, showId, seats, session);
      created = (await Booking.create(
        [{ code: await generateCode(), user: userId, show: showId, seats: pricing.lines, amount: pricing.amount, discount: pricing.discount, total: pricing.total, promoCode: pricing.promoCode }],
        { session },
      ))[0];
      await SeatHold.updateMany(
        { show: showId, seat: { $in: seats }, user: userId, status: 'held' },
        { $set: { booking: created._id, expiresAt: new Date(Date.now() + env.HOLD_TTL_SECONDS * 2 * 1000) } },
        { session },
      );
    });
    return created;
  } catch (error) {
    if (isRaceError(error)) throw conflict('Seat reservation changed. Please refresh and try again.');
    throw error;
  } finally {
    await session.endSession();
  }
};

export const payBooking = async (userId: string, bookingId: string, method: 'card' | 'upi' | 'netbanking', outcome: 'success' | 'failure') => {
  const booking = await Booking.findOne({ _id: bookingId, user: userId });
  if (!booking) throw notFound('Booking not found');
  if (booking.status !== 'pending') throw badRequest('This booking has already been processed');
  if (outcome === 'failure') {
    const payment = await Payment.create({
      booking: booking._id,
      user: userId,
      method,
      amount: booking.total,
      status: 'failed',
      transactionId: `SIMFAIL-${randomBytes(6).toString('hex').toUpperCase()}`,
      failureReason: 'Simulated payment declined by the test gateway',
      simulated: true,
    });
    booking.status = 'failed';
    booking.paymentStatus = 'failed';
    booking.payment = payment._id;
    await booking.save();
    await SeatHold.deleteMany({ booking: booking._id, status: 'held' });
    throw paymentFailed('Simulated payment was declined. No money was charged.', { booking, payment });
  }

  const session = await mongoose.startSession();
  try {
    let payment!: InstanceType<typeof Payment>;
    await session.withTransaction(async () => {
      const now = new Date();
      for (const seat of booking.seats) {
        const result = await SeatHold.updateOne(
          { show: booking.show, seat: seat.label, booking: booking._id, status: 'held', expiresAt: { $gt: now } },
          { $set: { status: 'booked', expiresAt: new Date('2099-12-31T00:00:00.000Z') } },
          { session },
        );
        if (result.matchedCount !== 1) throw conflict('Your seat hold expired before payment completed. Please select seats again.');
      }
      payment = (await Payment.create(
        [{ booking: booking._id, user: userId, method, amount: booking.total, status: 'succeeded', transactionId: `SIMPAY-${randomBytes(6).toString('hex').toUpperCase()}`, simulated: true }],
        { session },
      ))[0];
      await Booking.updateOne({ _id: booking._id }, { $set: { status: 'confirmed', paymentStatus: 'paid', payment: payment._id } }, { session });
    });
    const confirmed = await Booking.findById(booking._id);
    return { booking: confirmed, payment };
  } catch (error) {
    if (isRaceError(error)) throw conflict('Another booking claimed a seat. Please choose again.');
    throw error;
  } finally {
    await session.endSession();
  }
};

export const cancelBooking = async (userId: string, bookingId: string) => {
  const booking = await Booking.findOne({ _id: bookingId, user: userId });
  if (!booking) throw notFound('Booking not found');
  if (booking.status === 'cancelled') throw badRequest('Booking is already cancelled');
  if (booking.status === 'failed') throw badRequest('A failed booking cannot be cancelled');
  await SeatHold.deleteMany({ booking: booking._id, status: 'held' });
  if (booking.status === 'confirmed') {
    await SeatHold.deleteMany({ booking: booking._id, status: 'booked' });
  }
  booking.status = 'cancelled';
  if (booking.paymentStatus === 'paid') booking.paymentStatus = 'refunded';
  await booking.save();
  return booking;
};
