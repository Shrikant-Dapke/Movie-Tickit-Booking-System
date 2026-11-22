import request from 'supertest';
import mongoose from 'mongoose';
import { describe, expect, it } from 'vitest';
import { createApp } from '../app.js';
import { hashPassword } from '../lib/password.js';
import { signToken } from '../lib/jwt.js';
import { User } from '../models/User.js';
import { Movie } from '../models/Movie.js';
import { Theatre } from '../models/Theatre.js';
import { Screen } from '../models/Screen.js';
import { Seat } from '../models/Seat.js';
import { SeatHold } from '../models/SeatHold.js';
import { Show } from '../models/Show.js';
import { Booking } from '../models/Booking.js';

const app = createApp();
const api = () => request(app);
const tomorrow = () => new Date(Date.now() + 86_400_000).toISOString().slice(0, 10);

const makeUser = async (role: 'customer' | 'admin' = 'customer', email = `user${Math.random().toString(36).slice(2)}@example.com`) => {
  const user = await User.create({ name: role === 'admin' ? 'Admin' : 'Customer', email, passwordHash: await hashPassword('Password123!'), role });
  return { user, token: signToken({ sub: String(user._id), role, name: user.name }) };
};

const makeCatalogue = async () => {
  const movie = await Movie.create({
    title: 'Jury Test Movie', description: 'A full length description used for the jury test suite.', genre: ['Sci-Fi'],
    language: 'English', format: ['2D'], duration: 120, releaseDate: new Date(), certificate: 'UA', rating: 8,
    cast: ['Test Actor'], poster: 'https://example.com/poster.jpg', status: 'showing', featured: true,
  });
  const theatre = await Theatre.create({ name: 'Test Theatre', city: 'Pune', address: 'Test Address 12', amenities: ['IMAX'] });
  const screen = await Screen.create({
    theatre: theatre._id, name: 'Screen 1', format: '2D', rows: 2, seatsPerRow: 10,
    categories: [
      { name: 'Regular', startRow: 0, endRow: 0, basePrice: 200, color: '#64748b' },
      { name: 'Premium', startRow: 1, endRow: 1, basePrice: 400, color: '#e50914' },
    ],
  });
  const seats = await Seat.insertMany(
    ['A', 'B'].flatMap((row) => Array.from({ length: 10 }, (_, i) => ({
      screen: screen._id, label: `${row}${i + 1}`, row, number: i + 1,
      category: row === 'A' ? 'Regular' : 'Premium', basePrice: row === 'A' ? 200 : 400,
    }))),
  );
  const show = await Show.create({
    movie: movie._id, theatre: theatre._id, screen: screen._id, date: tomorrow(), time: '20:30', format: '2D',
    pricing: { Regular: 200, Premium: 400, Recliner: 600 },
  });
  return { movie, theatre, screen, seats, show };
};

const hold = (token: string, showId: string, seats: string[]) =>
  api().post(`/api/shows/${showId}/holds`).set('Authorization', `Bearer ${token}`).send({ seats });

const pay = (token: string, bookingId: string, outcome: 'success' | 'failure' = 'success') =>
  api().post(`/api/bookings/${bookingId}/pay`).set('Authorization', `Bearer ${token}`).send({ method: 'card', outcome });

describe('TC-01 — Customer registration, login and session (positive)', () => {
  it('registers, hashes the password, logs in and returns the current session', async () => {
    const registered = await api().post('/api/auth/register').send({ name: 'Asha', email: 'asha@example.com', password: 'Password123!' });
    expect(registered.status).toBe(201);
    expect(registered.body.data.user.email).toBe('asha@example.com');
    expect(registered.body.data.user.role).toBe('customer');
    expect(registered.body.data.user.passwordHash).toBeUndefined();

    const stored = await User.findOne({ email: 'asha@example.com' });
    expect(stored?.passwordHash).not.toBe('Password123!');

    const loggedIn = await api().post('/api/auth/login').send({ email: 'asha@example.com', password: 'Password123!' });
    expect(loggedIn.status).toBe(200);
    expect(loggedIn.body.data.token).toEqual(expect.any(String));

    const me = await api().get('/api/auth/me').set('Authorization', `Bearer ${loggedIn.body.data.token}`);
    expect(me.status).toBe(200);
    expect(me.body.data.name).toBe('Asha');
  });
});

describe('TC-02 — Authentication and admin authorization (negative)', () => {
  it('rejects anonymous customers and non-admin users from admin routes', async () => {
    expect((await api().get('/api/admin/overview')).status).toBe(401);
    const { token } = await makeUser();
    expect((await api().get('/api/admin/overview').set('Authorization', `Bearer ${token}`)).status).toBe(403);
    const admin = await makeUser('admin');
    expect((await api().get('/api/admin/overview').set('Authorization', `Bearer ${admin.token}`)).status).toBe(200);
  });
});

describe('TC-03 — Movie discovery, search and filters (positive)', () => {
  it('searches by title and filters by language and format', async () => {
    await Movie.create([
      { title: 'Solar Voyage', description: 'A long description one.', genre: ['Sci-Fi'], language: 'English', format: ['2D', 'IMAX'], duration: 120, releaseDate: new Date(), poster: 'https://example.com/a.jpg', status: 'showing' },
      { title: 'Monsoon Letters', description: 'A long description two.', genre: ['Drama'], language: 'Hindi', format: ['2D'], duration: 130, releaseDate: new Date(), poster: 'https://example.com/b.jpg', status: 'showing' },
    ]);
    const searched = await api().get('/api/movies?search=Solar');
    expect(searched.status).toBe(200);
    expect(searched.body.data).toHaveLength(1);
    expect(searched.body.data[0].title).toBe('Solar Voyage');

    const filtered = await api().get('/api/movies?language=Hindi&format=2D');
    expect(filtered.body.data).toHaveLength(1);
    expect(filtered.body.data[0].title).toBe('Monsoon Letters');
  });
});

describe('TC-04 — Show availability by movie and city (positive)', () => {
  it('returns only matching scheduled shows', async () => {
    const { movie } = await makeCatalogue();
    const result = await api().get(`/api/shows?movie=${movie.id}&city=Pune`);
    expect(result.status).toBe(200);
    expect(result.body.data).toHaveLength(1);
    expect(result.body.data[0].movie.title).toBe('Jury Test Movie');
  });
});

describe('TC-05 — Seat map categories and hold states (positive)', () => {
  it('reports available, held and own seats with correct prices', async () => {
    const { user, token } = await makeUser();
    const { show } = await makeCatalogue();
    const before = await api().get(`/api/shows/${show.id}/seats`);
    expect(before.status).toBe(200);
    expect(before.body.data.seats).toHaveLength(20);
    expect(before.body.data.seats[0]).toMatchObject({ label: 'A1', category: 'Regular', price: 200, status: 'available' });

    await hold(token, String(show._id), ['A1']);
    const after = await api().get(`/api/shows/${show.id}/seats`).set('Authorization', `Bearer ${token}`);
    const target = after.body.data.seats.find((s: { label: string }) => s.label === 'A1');
    expect(target).toMatchObject({ status: 'held', mine: true });
    expect(String((await SeatHold.findOne({ show: show._id, seat: 'A1' }))!.user)).toBe(String(user._id));
  });
});

describe('TC-06 — Maximum seat selection boundary', () => {
  it('allows 8 seats, rejects 9 and rejects duplicates', async () => {
    const { token } = await makeUser();
    const { show } = await makeCatalogue();
    const eight = ['A1', 'A2', 'A3', 'A4', 'A5', 'A6', 'A7', 'A8'];
    expect((await hold(token, String(show._id), eight)).status).toBe(201);
    expect((await hold(token, String(show._id), [...eight, 'A9'])).status).toBe(400);
    expect((await hold(token, String(show._id), ['A1', 'A1'])).status).toBe(400);
  });
});

describe('TC-07 — Complete booking + simulated payment + digital ticket (positive)', () => {
  it('confirms a booking and produces a QR ticket', async () => {
    const { token } = await makeUser();
    const { show } = await makeCatalogue();
    expect((await hold(token, String(show._id), ['A1', 'B1'])).status).toBe(201);

    const created = await api().post('/api/bookings').set('Authorization', `Bearer ${token}`).send({ showId: String(show._id), seats: ['A1', 'B1'] });
    expect(created.status).toBe(201);
    expect(created.body.data.code).toMatch(/^CB[0-9A-F]{10}$/);
    expect(created.body.data.total).toBe(600);
    expect(created.body.data.paymentSummary.seats).toHaveLength(2);

    const paid = await pay(token, created.body.data.id);
    expect(paid.status).toBe(200);
    expect(paid.body.data.booking.status).toBe('confirmed');
    expect(paid.body.data.payment.simulated).toBe(true);

    const ticket = await api().get(`/api/bookings/${created.body.data.id}/ticket`).set('Authorization', `Bearer ${token}`);
    expect(ticket.status).toBe(200);
    expect(ticket.body.data.qrDataUrl).toMatch(/^data:image\/png/);
    expect(ticket.body.data.downloadHtml).toContain(created.body.data.code);
    expect(ticket.body.data.downloadHtml).toContain('Jury Test Movie');

    expect(await SeatHold.countDocuments({ show: show._id, status: 'booked' })).toBe(2);

    const seatsAfter = await api().get(`/api/shows/${show.id}/seats`);
    expect(seatsAfter.body.data.seats.find((s: { label: string }) => s.label === 'A1').status).toBe('booked');
  });
});

describe('TC-08 — Concurrent seat contention (exceptional)', () => {
  it('lets exactly one of two customers hold the same seat', async () => {
    const first = await makeUser();
    const second = await makeUser();
    const { show } = await makeCatalogue();
    const seatId = String(show._id);

    const [a, b] = await Promise.allSettled([hold(first.token, seatId, ['A1']), hold(second.token, seatId, ['A1'])]);
    const statuses = [a, b].map((result) => (result.status === 'fulfilled' ? result.value.status : 500)).sort();
    expect(statuses).toEqual([201, 409]);

    const winner = [a, b].find((result) => result.status === 'fulfilled' && result.value.status === 201) as PromiseFulfilledResult<request.Response>;
    const loser = [a, b].find((result) => result.status === 'fulfilled' && result.value.status === 409) as PromiseFulfilledResult<request.Response>;
    const winnerToken = winner.value.body.data.holds ? first.token : second.token;
    const loserToken = winnerToken === first.token ? second.token : first.token;
    expect(loser.value.body.message).toMatch(/just taken|conflict|already/i);

    const attempted = await api().post('/api/bookings').set('Authorization', `Bearer ${loserToken}`).send({ showId: seatId, seats: ['A1'] });
    expect(attempted.status).toBe(409);
    expect(await SeatHold.countDocuments({ show: show._id, seat: 'A1' })).toBe(1);
  });
});

describe('TC-09 — Simulated failed payment (negative)', () => {
  it('declines the payment, fails the booking and releases the seats', async () => {
    const { token } = await makeUser();
    const { show } = await makeCatalogue();
    await hold(token, String(show._id), ['A2']);
    const created = await api().post('/api/bookings').set('Authorization', `Bearer ${token}`).send({ showId: String(show._id), seats: ['A2'] });

    const failed = await pay(token, created.body.data.id, 'failure');
    expect(failed.status).toBe(402);
    expect(failed.body.data.payment.status).toBe('failed');
    expect(failed.body.data.booking.status).toBe('failed');
    expect(await SeatHold.countDocuments({ show: show._id, seat: 'A2', status: 'held' })).toBe(0);
    expect((await api().get(`/api/shows/${show.id}/seats`)).body.data.seats.find((s: { label: string }) => s.label === 'A2').status).toBe('available');
  });
});

describe('TC-10 — Booking history and details (positive)', () => {
  it('lists the customer’s bookings with populated movie and theatre', async () => {
    const { token } = await makeUser();
    const { show } = await makeCatalogue();
    await hold(token, String(show._id), ['A3']);
    const created = await api().post('/api/bookings').set('Authorization', `Bearer ${token}`).send({ showId: String(show._id), seats: ['A3'] });
    await pay(token, created.body.data.id);

    const history = await api().get('/api/bookings/mine').set('Authorization', `Bearer ${token}`);
    expect(history.status).toBe(200);
    expect(history.body.data).toHaveLength(1);
    expect(history.body.data[0].show.movie.title).toBe('Jury Test Movie');
    expect(history.body.data[0].show.theatre.name).toBe('Test Theatre');
  });
});

describe('TC-11 — Admin CRUD for movies, theatres, screens and shows (positive)', () => {
  it('creates, updates and deletes catalogue resources', async () => {
    const admin = await makeUser('admin');
    const auth = `Bearer ${admin.token}`;
    const movie = await api().post('/api/movies').set('Authorization', auth).send({
      title: 'Admin Movie', description: 'Created by the admin test.', genre: ['Drama'], language: 'Hindi', format: ['2D'],
      duration: 130, releaseDate: '2026-12-01', poster: 'https://example.com/admin.jpg', rating: 7,
    });
    expect(movie.status).toBe(201);
    expect((await api().patch(`/api/movies/${movie.body.data.id}`).set('Authorization', auth).send({ rating: 9 })).body.data.rating).toBe(9);

    const theatre = await api().post('/api/theatres').set('Authorization', auth).send({ name: 'Admin Theatre', city: 'Mumbai', address: 'Admin Road 1', amenities: [] });
    expect(theatre.status).toBe(201);
    const screen = await api().post(`/api/theatres/${theatre.body.data.id}/screens`).set('Authorization', auth).send({
      name: 'Screen A', format: '2D', rows: 3, seatsPerRow: 8,
      categories: [{ name: 'Regular', startRow: 0, endRow: 2, basePrice: 180, color: '#64748b' }],
    });
    expect(screen.status).toBe(201);
    expect(await Seat.countDocuments({ screen: screen.body.data.id })).toBe(24);

    const show = await api().post('/api/shows').set('Authorization', auth).send({
      movie: movie.body.data.id, theatre: theatre.body.data.id, screen: screen.body.data.id,
      date: tomorrow(), time: '19:00', format: '2D', pricing: { Regular: 180, Premium: 300, Recliner: 500 },
    });
    expect(show.status).toBe(201);
    expect((await api().delete(`/api/shows/${show.body.data.id}`).set('Authorization', auth)).body.data.message).toBe('Show cancelled');
    expect((await api().delete(`/api/movies/${movie.body.data.id}`).set('Authorization', auth)).status).toBe(200);
  });
});

describe('TC-12 — Expired reservation cannot be booked (exceptional)', () => {
  it('rejects checkout after hold expiry and allows another customer to take the seat', async () => {
    const first = await makeUser();
    const second = await makeUser();
    const { show } = await makeCatalogue();
    await hold(first.token, String(show._id), ['A4']);
    await SeatHold.updateMany({ show: show._id, seat: 'A4' }, { $set: { expiresAt: new Date(Date.now() - 1000) } });

    const attempted = await api().post('/api/bookings').set('Authorization', `Bearer ${first.token}`).send({ showId: String(show._id), seats: ['A4'] });
    expect(attempted.status).toBe(409);
    expect((await hold(second.token, String(show._id), ['A4'])).status).toBe(201);
  });
});

describe('TC-13 — Invalid inputs are rejected (negative / boundary)', () => {
  it('validates registration, identifiers and show requests', async () => {
    expect((await api().post('/api/auth/register').send({ name: 'A', email: 'bad', password: 'short' })).status).toBe(400);
    expect((await api().get('/api/movies/not-an-id')).status).toBe(400);
    expect((await hold('not-a-token', new mongoose.Types.ObjectId().toString(), ['A1'])).status).toBe(401);
    const { token } = await makeUser();
    expect((await api().post('/api/bookings').set('Authorization', `Bearer ${token}`).send({ showId: new mongoose.Types.ObjectId().toString(), seats: [] })).status).toBe(400);
  });
});

describe('TC-15 — Poster upload (positive / negative)', () => {
  const png = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==', 'base64');

  it('lets an admin upload an image but blocks customers and non-images', async () => {
    const admin = await makeUser('admin');
    const customer = await makeUser();
    const endpoint = '/api/admin/uploads/poster';

    const denied = await api().post(endpoint).set('Authorization', `Bearer ${customer.token}`).attach('poster', png, { filename: 'poster.png', contentType: 'image/png' });
    expect(denied.status).toBe(403);

    const uploaded = await api().post(endpoint).set('Authorization', `Bearer ${admin.token}`).attach('poster', png, { filename: 'poster.png', contentType: 'image/png' });
    expect(uploaded.status).toBe(201);
    expect(uploaded.body.data.url).toMatch(/^\/uploads\/[0-9a-f-]+\.png$/);

    const served = await api().get(uploaded.body.data.url);
    expect(served.status).toBe(200);

    const invalid = await api().post(endpoint).set('Authorization', `Bearer ${admin.token}`).attach('poster', Buffer.from('not an image'), { filename: 'bad.txt', contentType: 'text/plain' });
    expect(invalid.status).toBe(400);
  });
});

describe('TC-14 — End-to-end customer workflow', () => {
  it('register → browse → show → seats → hold → book → pay → ticket → history', async () => {
    const registered = await api().post('/api/auth/register').send({ name: 'Workflow User', email: 'workflow@example.com', password: 'Password123!' });
    const token = registered.body.data.token;
    const { movie, show } = await makeCatalogue();

    expect((await api().get('/api/movies?search=Jury')).body.data).toHaveLength(1);
    expect((await api().get(`/api/movies/${movie.id}`)).status).toBe(200);
    expect((await api().get(`/api/shows?movie=${movie.id}`)).body.data).toHaveLength(1);
    const seatMap = await api().get(`/api/shows/${show.id}/seats`);
    expect(seatMap.body.data.seats.length).toBeGreaterThan(0);

    await hold(token, String(show._id), ['A5', 'A6']);
    const booking = await api().post('/api/bookings').set('Authorization', `Bearer ${token}`).send({ showId: String(show._id), seats: ['A5', 'A6'], promoCode: undefined });
    expect(booking.status).toBe(201);
    const paid = await pay(token, booking.body.data.id);
    expect(paid.body.data.booking.status).toBe('confirmed');
    const ticket = await api().get(`/api/bookings/${booking.body.data.id}/ticket`).set('Authorization', `Bearer ${token}`);
    expect(ticket.body.data.qrDataUrl).toMatch(/^data:image\/png/);
    const history = await api().get('/api/bookings/mine').set('Authorization', `Bearer ${token}`);
    expect(history.body.data).toHaveLength(1);
    expect(await Booking.countDocuments({ status: 'confirmed' })).toBe(1);
  });
});
