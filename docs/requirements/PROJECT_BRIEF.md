# CineBook — Movie Ticket Booking System (Authoritative Project Brief)

> Preserved verbatim from the user-supplied Jury 1 / project specification. This is the source of truth for project-specific functional requirements. The End Semester Jury Instructions PDF defines evaluation process only.

# Build CineBook – Movie Ticket Booking System

Build a complete, modern, fully functional Movie Ticket Booking System called **CineBook** using the MERN stack. Your priority is to deliver a polished, working application with functional frontend, backend, database integration and complete end-to-end workflows. Do not spend time producing excessive planning documents. Start implementing the application.

## 1. Customer Authentication
- User registration.
- User login and logout.
- JWT-based authentication.
- Secure password hashing.
- Role-based access control.
- Customer profile.
- View booking history.

## 2. Homepage and Movie Discovery
- Modern movie-booking homepage.
- Currently showing movies.
- Upcoming movies.
- Featured and trending movies.
- Movie posters and banners.
- Search movies by title.
- Filter by genre, language and format.
- Movie details including: Title, Description, Genre, Duration, Release date, Language, Rating, Cast, Poster and trailer.
- Movie trailer viewing.
- Use realistic sample movie data.

## 3. Theatre and Show Management
- Display available theatres.
- Theatre details and locations.
- Show schedules.
- Select a city and theatre.
- Show timings.
- Screen information.
- Different show formats such as 2D and 3D.
- Show availability.
- Admin ability to create, update and delete theatres, screens and shows.

## 4. Interactive Seat Selection
This is one of the most important features. Implement an interactive cinema seating layout.

Features:
- Visual seat arrangement.
- Different seat categories (Regular, Premium, Recliner).
- Different pricing for seat categories.
- Available seats.
- Selected seats.
- Temporarily locked seats.
- Already booked seats.
- Live seat availability updates.
- Maximum seat selection limit.
- Dynamic ticket price calculation.
- Booking summary.
- Use different visual states and a clear legend.

**Important:** Implement concurrency-safe seat locking. Two customers must never successfully book the same seat. Temporary seat holds should automatically expire when the booking session expires or the customer abandons checkout.

## 5. Booking System
- Select movie.
- Select theatre.
- Select date.
- Select showtime.
- Select seats.
- Review booking summary.
- Calculate ticket prices.
- Apply available promotional codes if implemented.
- Confirm booking.
- Generate a unique booking ID.
- Generate a digital ticket.
- Booking confirmation page.
- Booking history.
- Booking details.

Prevent duplicate bookings and ensure seat availability is validated before confirmation.

## 6. Payment Integration
For the prototype, implement a simulated payment gateway.

Features:
- Payment summary.
- Payment method selection.
- Simulated successful payment.
- Simulated failed payment.
- Payment status.
- Booking confirmation after successful simulated payment.

Clearly label this as a simulated payment system. Do not represent simulated transactions as real payments.

## 7. Digital Tickets
Generate a digital ticket containing:
- Booking ID.
- Movie name.
- Theatre name.
- Screen.
- Show date and time.
- Selected seats.
- Ticket price.
- Booking status.
- QR code for ticket identification.

Provide an option to download or print the ticket.

## 8. Customer Dashboard
- Profile information.
- Upcoming bookings.
- Previous bookings.
- Booking details.
- Ticket access.
- Booking status.

## 9. Admin Dashboard
Create a separate, protected admin dashboard.

### Dashboard Overview
- Total registered customers.
- Total movies.
- Total theatres.
- Total shows.
- Total bookings.
- Revenue from recorded bookings.
- Recent bookings.
- Basic booking statistics.

### Movie Management
- Add movies.
- Edit movies.
- Delete movies.
- Upload movie posters.
- Manage movie details.
- Manage movie availability.

### Theatre Management
- Add theatres.
- Edit theatres.
- Delete theatres.
- Manage screens.
- Configure seating layouts.
- Configure seat categories and pricing.

### Show Management
- Create movie shows.
- Assign movies to theatres and screens.
- Set show dates and timings.
- Configure ticket prices.
- Update or cancel shows.

### Booking Management
- View all bookings.
- Search bookings.
- Filter bookings.
- View booking details.
- Track booking and payment status.

## 10. UI/UX Requirements
Build a premium, modern movie-booking experience.

Design direction:
- Dark cinematic theme.
- Black and deep charcoal backgrounds.
- Red or vibrant accent colours.
- Large movie posters.
- Attractive movie cards.
- Smooth animations and transitions.
- Responsive layouts.
- Modern typography.
- Clean navigation.
- Interactive buttons and components.
- Loading states.
- Empty states.
- Error states.
- Toast notifications.
- Confirmation dialogs.

The application must work properly on desktop, tablet and mobile. Avoid generic admin templates. Make the interface feel like a real commercial movie-booking platform.

## 11. Technical Requirements

### Frontend
- React.
- TypeScript.
- Vite.
- Tailwind CSS.
- React Router.
- Axios or an equivalent API client.
- Proper component architecture.
- Reusable UI components.
- Form validation.

### Backend
- Node.js.
- Express.js.
- TypeScript.
- REST APIs.
- MongoDB.
- Mongoose.
- JWT authentication.
- Role-based authorization.
- Zod validation.
- Centralized error handling.

### Database
Create appropriate database models for: Users, Movies, Theatres, Screens, Seats, Shows, Seat holds, Bookings, Payments. Design proper relationships, indexes and validation rules.

## 12. Reliability and Security
- Prevent double booking.
- Handle concurrent seat reservations safely.
- Use atomic database operations and transactions where required.
- Ensure temporary seat holds expire correctly.
- Prevent unauthorized admin access.
- Validate all API inputs.
- Secure passwords.
- Protect sensitive endpoints.
- Handle API errors properly.
- Never trust frontend booking or pricing calculations without backend verification.

Use `mongodb-memory-server` for integration and concurrency testing, with a real MongoDB configuration path for the final demonstration.

## 13. Testing
Implement automated tests covering: Authentication, Movie discovery, Show availability, Seat selection, Seat locking, Concurrent booking attempts, Booking confirmation, Failed payment simulation, Admin authorization, Invalid inputs. Include positive, negative and boundary/exceptional cases.

## 14. Final Expected Result
Deliver a complete working prototype with these end-to-end workflows:

**Customer workflow:** Register → Login → Browse Movies → Select Movie → Select Theatre → Select Show → Select Seats → Checkout → Simulated Payment → Booking Confirmation → Digital Ticket.

**Admin workflow:** Admin Login → Dashboard → Manage Movies → Manage Theatres → Manage Screens → Manage Shows → Monitor Bookings.

## Development Instructions
1. Inspect the existing repository.
2. Preserve Git history.
3. Replace the old implementation where necessary.
4. Build the complete frontend and backend.
5. Connect all frontend functionality to real backend APIs.
6. Implement database integration.
7. Add realistic seed data and demo accounts.
8. Run the application and verify all major workflows.
9. Fix errors before considering the prototype complete.
10. Provide setup instructions and demo credentials.

Do not create buttons that do nothing, fake dashboards, static booking confirmations or frontend-only functionality. Every major feature must actually work.

**Final objective: Deliver a polished, functional CineBook movie ticket booking platform that can be demonstrated live during the final college jury.**
