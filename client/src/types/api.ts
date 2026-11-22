/** Shared API types — mirror docs/api/CONTRACT.md exactly. */

export interface ApiEnvelope<T> {
  success: boolean;
  data?: T;
  message?: string;
  errors?: Record<string, string>;
}

export type UserRole = 'customer' | 'admin';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  phone?: string;
  createdAt: string;
}

export interface AuthResponse {
  token: string;
  user: User;
}

export type MovieStatus = 'showing' | 'upcoming';

export interface Movie {
  id: string;
  title: string;
  description: string;
  genre: string[];
  language: string;
  format: string[];
  duration: number;
  releaseDate: string;
  certificate: string;
  rating: number;
  cast: string[];
  poster: string;
  backdrop?: string;
  trailerUrl?: string;
  status: MovieStatus;
  featured: boolean;
  trending: boolean;
  /** Optional enrichment supplied by the catalogue seed. */
  director?: string;
  synopsis?: string;
  popularity?: number;
}

export interface Theatre {
  id: string;
  name: string;
  city: string;
  address: string;
  amenities: string[];
  phone: string;
  /** Optional enrichment supplied by the catalogue seed. */
  area?: string;
  chain?: string;
}

export interface SeatCategory {
  name: string;
  startRow: number | string;
  endRow: number | string;
  basePrice: number;
  color?: string;
}

export interface Screen {
  id: string;
  theatre: Theatre | string;
  name: string;
  format: string;
  rows: number;
  seatsPerRow: number;
  categories: SeatCategory[];
}

export interface Seat {
  id: string;
  label: string;
  row: number | string;
  number: number;
  category: string;
  basePrice: number;
}

export type TheatreWithScreens = Theatre & { screens: Screen[] };
export type ScreenWithSeats = Screen & { seats: Seat[] };

export interface Pricing {
  Regular: number;
  Premium: number;
  Recliner: number;
}

export type ShowStatus = 'scheduled' | 'cancelled';

/** GET /shows returns populated movie / theatre / screen. */
export interface Show {
  id: string;
  movie: Movie;
  theatre: Theatre;
  screen: Screen;
  date: string;
  time: string;
  format: string;
  pricing: Pricing;
  status: ShowStatus;
}

/** Payload for POST /shows and PATCH /shows/:id. */
export interface ShowInput {
  movie: string;
  theatre: string;
  screen: string;
  date: string;
  time: string;
  format: string;
  pricing: Pricing;
  status?: ShowStatus;
}

export type SeatStatus = 'available' | 'held' | 'booked' | 'selected';

export interface SeatState {
  label: string;
  row: number | string;
  number: number;
  category: string;
  price: number;
  status: SeatStatus;
  mine: boolean;
}

export interface SeatAvailability {
  seats: SeatState[];
  categories: SeatCategory[];
  available: number;
  held: number;
  booked: number;
  expiresIn: number;
}

export interface HoldsResponse {
  holds: Array<{ show: string; seat: string; expiresAt?: string }>;
  expiresAt: string;
}

export interface PromoValidation {
  code: string;
  discountPercent: number;
  discount: number;
  total: number;
  valid: boolean;
}

export type BookingStatus = 'pending' | 'confirmed' | 'failed' | 'cancelled';
export type PaymentStatus = 'unpaid' | 'paid' | 'failed' | 'refunded';
export type PaymentMethod = 'card' | 'upi' | 'netbanking';
export type PaymentOutcome = 'success' | 'failure';

export interface BookingSeat {
  label: string;
  category: string;
  price: number;
}

export interface Payment {
  id: string;
  booking: string | { id: string; code?: string };
  method: PaymentMethod;
  amount: number;
  status: PaymentStatus;
  simulated: true;
  transactionId: string;
  failureReason?: string;
  seeded?: boolean;
  createdAt: string;
}

export interface PaymentSummary {
  subtotal?: number;
  amount?: number;
  discount?: number;
  total?: number;
  seats?: number;
  [key: string]: unknown;
}

export interface Booking {
  id: string;
  code: string;
  user: User | string;
  show: Show;
  seats: BookingSeat[];
  amount: number;
  discount: number;
  total: number;
  status: BookingStatus;
  paymentStatus: PaymentStatus;
  payment?: Payment | string;
  paymentSummary?: PaymentSummary;
  /** Demo/seed records are flagged by the API when available. */
  seeded?: boolean;
  createdAt: string;
}

export interface RecentActivity {
  id: string;
  code: string;
  movie: string;
  poster: string | null;
  bookingDate: string;
  showDate: string | null;
  showTime: string | null;
  status: BookingStatus;
  paymentStatus: PaymentStatus;
  amount: number;
}

export interface CustomerDashboardSummary {
  totalBookings: number;
  upcomingBookings: number;
  completedBookings: number;
  moviesWatched: number;
  totalSpent: number;
  nextUpcoming: Booking | null;
  recentActivity: RecentActivity[];
}

export interface TicketData {
  booking: Booking;
  qrDataUrl: string;
  downloadHtml: string;
}

export interface AdminOverview {
  customers: number;
  movies: number;
  theatres: number;
  shows: number;
  bookings: number;
  revenue: number;
  recentBookings: Booking[];
  byStatus: Record<string, number>;
}

export interface MovieFilters {
  search?: string;
  genre?: string;
  language?: string;
  format?: string;
  status?: MovieStatus | string;
  featured?: boolean | string;
}

export interface ShowFilters {
  movie?: string;
  theatre?: string;
  city?: string;
  date?: string;
  format?: string;
}

export interface BookingFilters {
  status?: BookingStatus | string;
  search?: string;
}
