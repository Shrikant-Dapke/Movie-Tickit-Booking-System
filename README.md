# CineBook — Movie Ticket Booking System

A MERN-stack cinema booking platform built for the ASD Final Jury Assessment, extending the Jury 2 requirements: movie discovery, show schedules, live seat states, temporary seat holds, booking confirmation, and theatre administration.

## Stack
- React + Vite + TypeScript + Tailwind CSS
- Node.js + Express
- MongoDB + Mongoose
- JWT authentication with role-based authorization

## Monorepo
- `server/` — REST API, MongoDB models, authentication, seat-locking and booking logic
- `client/` — responsive customer and admin application

## Run locally
1. Install Node.js 20+ and MongoDB.
2. Copy `server/.env.example` to `server/.env` and configure values.
3. Run `npm install` in `server/` and `npm run dev`.
4. Run `npm install` in `client/` and `npm run dev`.

See `server/README.md` for API setup and demo-data seeding.

## Assessment scope
The app includes explicit empty-show states, retryable availability errors, booked-seat protection, expiring seat holds, booking records, and admin schedule management. Payment is represented as a demo checkout flow; no real payment is collected.
