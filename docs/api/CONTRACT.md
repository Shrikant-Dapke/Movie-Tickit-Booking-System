# CineBook REST API Contract (v1)

Base URL: `http://localhost:5000/api` (override with `VITE_API_URL` on client).

All responses use the envelope:
```ts
{ success: boolean; data?: T; message?: string; errors?: Record<string,string> }
```
Errors use the same envelope with `success:false` and an appropriate HTTP status. A payment failure returns **402** with `data: { payment, booking }`.

Auth: `Authorization: Bearer <jwt>` for protected routes. Roles: `customer`, `admin`.

---

## Auth (`/auth`)
| Method | Path | Auth | Body → Response `data` |
|---|---|---|---|
| POST | `/auth/register` | – | `{name,email,password}` → `{token,user}` |
| POST | `/auth/login` | – | `{email,password}` → `{token,user}` |
| POST | `/auth/logout` | ✓ | → `{message}` |
| GET | `/auth/me` | ✓ | → `User` |
| PATCH | `/auth/me` | ✓ | `{name?,phone?}` → `User` |

`User = { id, name, email, role, phone?, createdAt }`

## Movies (`/movies`)
| Method | Path | Auth | Notes |
|---|---|---|---|
| GET | `/movies` | – | Query: `search,genre,language,format,status,featured` → `Movie[]` |
| GET | `/movies/:id` | – | → `Movie` |
| POST | `/movies` | admin | → `Movie` |
| PATCH | `/movies/:id` | admin | → `Movie` |
| DELETE | `/movies/:id` | admin | → `{message}` |

`Movie = { id,title,description,genre:string[],language,format:string[],duration,releaseDate,certificate,rating,cast:string[],poster,backdrop,trailerUrl,status:'showing'|'upcoming',featured,trending }`

## Theatres (`/theatres`)
GET `/theatres?city=` → `Theatre[]` · GET `/theatres/:id` → `Theatre & {screens:Screen[]}` · POST/PATCH/DELETE `/theatres[/:id]` (admin).
`Theatre = { id,name,city,address,amenities:string[],phone }`

## Screens (`/screens`)
GET `/screens/:id` → `Screen & {seats:Seat[]}` · GET `/theatres/:theatreId/screens` → `Screen[]` · POST `/theatres/:theatreId/screens` (admin) body `{name,format,rows,seatsPerRow,categories:[{name,startRow,endRow,basePrice,color}]}` → `Screen` · PATCH/DELETE `/screens/:id` (admin).
`Screen = { id,theatre,name,format,rows,seatsPerRow,categories }`; `Seat = { id,label,row,number,category,basePrice }`

## Shows (`/shows`)
GET `/shows?movie=&theatre=&city=&date=&format=` → `Show[]` (populated movie/theatre/screen) · GET `/shows/:id` → `Show` · POST/PATCH/DELETE `/shows[/:id]` (admin).
`Show = { id,movie,theatre,screen,date:'YYYY-MM-DD',time:'HH:mm',format,pricing:{Regular,Premium,Recliner},status:'scheduled'|'cancelled' }`

## Seats & holds (`/shows/:showId/...`)
| Method | Path | Auth | Notes |
|---|---|---|---|
| GET | `/shows/:showId/seats` | – | → `{seats:SeatState[],categories,available,held,booked,expiresIn}` |
| POST | `/shows/:showId/holds` | ✓ | `{seats:string[]}` (1–8) → `{holds,expiresAt}` |
| DELETE | `/shows/:showId/holds` | ✓ | release own holds → `{message}` |

`SeatState = { label,row,number,category,price,status:'available'|'held'|'booked'|'selected',mine:boolean }`
Holds are atomic (unique `{show,seat}`), expire after `HOLD_TTL_SECONDS` (default 300s), and conflicts return **409**.

## Promo (`/promo`)
POST `/promo/validate` (auth) `{code,amount}` → `{code,discountPercent,discount,total,valid:true}`

## Bookings (`/bookings`) — authenticated
| Method | Path | Notes |
|---|---|---|
| POST | `/bookings` | `{showId,seats:string[],promoCode?}` → `Booking` with `paymentSummary`; verifies holds + recomputes price server-side |
| POST | `/bookings/:id/pay` | `{method:'card'\|'upi'\|'netbanking', outcome:'success'\|'failure'}` → `Booking` confirmed; `402` on simulated failure |
| GET | `/bookings/mine` | → `Booking[]` (populated) |
| GET | `/bookings/:id` | → `Booking` (populated) |
| GET | `/bookings/:id/ticket` | → `{booking,qrDataUrl,downloadHtml}` |
| DELETE | `/bookings/:id` | cancel own pending booking |

`Booking = { id,code,user,show,seats:[{label,category,price}],amount,discount,total,status:'pending'|'confirmed'|'failed'|'cancelled',paymentStatus:'unpaid'|'paid'|'failed',payment?,createdAt }`

## Payments (`/payments`)
GET `/payments/:id` → `Payment` (auth, owner or admin). `Payment = { id,booking,method,amount,status,simulated:true,transactionId,failureReason?,createdAt }`

## Admin (`/admin`) — admin only
GET `/admin/overview` → `{customers,movies,theatres,shows,bookings,revenue,recentBookings,byStatus}` · GET `/admin/bookings?status=&search=` → `Booking[]` · PATCH `/admin/bookings/:id` → `Booking` · GET `/admin/users` → `User[]`

## System
GET `/health` → `{status:'ok',service:'CineBook API'}`
