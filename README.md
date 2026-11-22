# CineBook — Movie Ticket Booking System

A MERN-stack cinema booking platform built for the ASD Final Jury Assessment, extending Jury 2 requirements: movie discovery, show schedules, seat availability, temporary seat holds, booking confirmation and theatre administration.

## Stack
- React + Vite + Tailwind CSS
- Node.js + Express
- MongoDB + Mongoose
- JWT authentication and role-based authorization

## Run locally
**Prerequisites:** Node.js 20+ and MongoDB running locally.

1. Clone the repository.
2. From the repository root run `npm install`.
3. Copy `server/.env.example` to `server/.env` and set a strong `JWT_SECRET`.
4. Start the API: `npm run dev:server`.
5. In another terminal seed the demo catalogue: `npm run seed`.
6. Start the client: `npm run dev:client`.
7. Open http://localhost:5173.

### Demo admin
- Email: `admin@cinebook.demo`
- Password: `Admin123!`

Change demo credentials and JWT secret before any public deployment.

## Implemented
- Customer registration and login; admin role protection.
- Movie catalogue with search, details and seeded demo titles.
- Show schedule lookup by movie, date and city.
- Interactive 60-seat layout with available, held and booked states.
- Five-minute server-side seat holds, conflict responses and revalidation at checkout.
- Booking records, unique booking references and booking history.
- Admin overview metrics, movie creation and show creation API.
- Explicit empty states for missing shows and retryable seat availability errors.

## API overview
- `POST /api/auth/register`, `POST /api/auth/login`
- `GET /api/movies`, `GET /api/movies/:id`
- `GET /api/shows`, `GET /api/shows/:id/seats`
- `POST /api/shows/:id/hold` (authenticated)
- `POST /api/bookings`, `GET /api/bookings/mine` (authenticated)
- `GET /api/admin/overview`, `POST /api/admin/movies`, `POST /api/admin/shows` (admin)

## Assessment notes
The checkout is a demonstration booking flow; it does not collect real payments. Seat holds reduce collisions and checkout requires an active hold. For production, add MongoDB transactions/atomic reservation claims, payment-provider integration, email delivery, rate limiting, audit logs, stronger admin CRUD and automated integration tests.
