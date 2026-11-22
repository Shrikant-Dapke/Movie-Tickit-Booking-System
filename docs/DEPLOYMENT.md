# CineBook — Setup & Deployment Guide

## Root causes of the reported failure (fixed 2026-11-22)

| Symptom | Actual root cause | Fix |
|---|---|---|
| `Network Error` on registration | The API was not listening on port 5000. MongoDB was not running, so `server.ts` exited immediately; the SPA still called port 5000. | `server.ts` now retries the DB connection instead of exiting; `GET /api/health` reports DB connectivity; clear startup logs. |
| `Sign in failed` toast on registration | `applyApiError()` used that title for **every** auth error and every network error. | Title is now `Sign in failed` for login and `Registration failed` for registration; network errors explain that the API is unreachable. |
| No movies/theatres/shows visible | The `cinebook` database was empty — seed had never run because MongoDB was down. | MongoDB started as a replica set and seed executed; verified counts below. |
| `.env` ignored by the API | `dotenv/config` was imported by the seed but **not** by the API entry point, so the API used the default URI without `?replicaSet=rs0` (transactions would fail). | `import 'dotenv/config'` added in `server/src/config/env.ts`. |
| `npm run dev` unreliable on Windows | The script used `&`, which is not a cross-platform parallel runner. | Uses `concurrently` with labelled API/WEB output. |
| Frontend failed when `VITE_API_URL` was absent | No dev proxy existed. | Vite proxies `/api` and `/uploads` to port 5000; default API base is `/api`; production still supports `VITE_API_URL`. |

## Exact local start commands

```powershell
# 1. MongoDB (single-node replica set — required for booking transactions)
mkdir C:\cinebook-data
& 'C:\Program Files\MongoDB\Server\8.2\bin\mongod.exe' --dbpath C:\cinebook-data --replSet rs0 --bind_ip 127.0.0.1 --port 27017

# 2. In a second terminal, initiate the replica set (one time only)
& 'C:\Users\dapke\AppData\Local\Programs\mongosh\mongosh.exe' --eval 'rs.initiate({_id:"rs0",members:[{_id:0,host:"127.0.0.1:27017"}]})'

# 3. Environment files (gitignored)
copy server\.env.example server\.env
copy client\.env.example client\.env

# 4. Dependencies, seed, and both apps
npm install
npm run seed
npm run dev
```

Open **http://localhost:5173**. Verify the backend with `npm run health` or `curl http://localhost:5000/api/health`.

No local MongoDB? `npm --workspace @cinebook/server run demo:memory` seeds an in-memory replica set and starts the API; run `npm run dev:client` separately.

## Verified database counts (real MongoDB, `cinebook` DB)

```
users 5 | movies 8 | theatres 3 | screens 9 | seats 900 |
shows 198 | seatholds 2 | bookings 1 | payments 1 | promos 2
```
(Mongoose collection name is `seatholds`, not `seatlocks`.)

## Production deployment

### Backend
1. Deploy `server/` as a Node service (container, PM2, systemd, or a PaaS).
2. Install production deps and build: `npm ci && npm run build`; start with `npm start` (runs `node dist/server.js`).
3. Environment: `NODE_ENV=production`, `PORT`, `MONGODB_URI` (a **replica set** — transactions require it), `JWT_SECRET` (strong, secret), `JWT_EXPIRES_IN`, `CLIENT_ORIGIN` (comma-separated allowed origins).
4. Run `npm run seed` once against the production DB only if demo data is desired.
5. Mount `server/uploads` as a persistent volume for uploaded posters.
6. Expose `GET /api/health` to your uptime monitor; it returns 503 when the DB is down.

### Frontend
1. `npm ci && npm run build` in `client/` → static files in `client/dist`.
2. Set `VITE_API_URL` **at build time** to the deployed API origin, e.g. `https://api.example.com/api`.
3. Serve as a static SPA with a catch-all rewrite to `index.html` (React Router needs it).
4. Alternatively, reverse-proxy `/api` and `/uploads` to the backend and leave `VITE_API_URL` unset (uses `/api`).

### Security
- `.env`, `server/uploads/*`, `node_modules`, `dist` and coverage output are gitignored.
- No credentials or JWT secrets are committed; `JWT_SECRET` must be overridden in production (validated at startup).
- Never expose MongoDB credentials in client-side code or build artefacts.

## Verification commands

```bash
npm run typecheck    # both workspaces
npm test             # 16 integration tests (in-memory replica set)
npm run build        # production builds
npm run health       # live API + DB status
```
