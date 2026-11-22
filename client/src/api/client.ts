import axios, {
  AxiosError,
  type AxiosRequestConfig,
  type InternalAxiosRequestConfig,
} from 'axios';
import type {
  ApiEnvelope,
  AuthResponse,
  Booking,
  BookingFilters,
  BookingStatus,
  HoldsResponse,
  Movie,
  MovieFilters,
  Payment,
  PaymentMethod,
  PaymentOutcome,
  PromoValidation,
  Screen,
  ScreenWithSeats,
  SeatAvailability,
  SeatCategory,
  Show,
  ShowFilters,
  ShowInput,
  Theatre,
  TheatreWithScreens,
  User,
  AdminOverview,
  CustomerDashboardSummary,
  TicketData,
} from '@/types/api';

export const TOKEN_KEY = 'cinebook_token';

export function getToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

export function setToken(token: string): void {
  localStorage.setItem(TOKEN_KEY, token);
}

export function clearToken(): void {
  localStorage.removeItem(TOKEN_KEY);
}

export class ApiError extends Error {
  status: number;
  errors?: Record<string, string>;
  data?: unknown;

  constructor(message: string, status = 0, errors?: Record<string, string>, data?: unknown) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.errors = errors;
    this.data = data;
  }
}

// In development, `/api` is proxied by Vite to http://127.0.0.1:5000.
// Production deployments set VITE_API_URL to the deployed API origin.
export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
  headers: { 'Content-Type': 'application/json' },
  timeout: 20000,
});

api.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  const token = getToken();
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

function isAuthEndpoint(url?: string): boolean {
  // `/auth/me` is the session probe: a 401 there is handled by AuthProvider,
  // which clears the token and lets RequireAuth redirect through the router.
  // A hard window redirect here would race with session restoration on reload.
  return !!url && /\/auth\/(login|register|me|logout)$/.test(url);
}

api.interceptors.response.use(
  (response) => {
    const payload = response.data as ApiEnvelope<unknown>;
    if (payload && typeof payload === 'object' && 'success' in payload) {
      if (!payload.success) {
        throw new ApiError(payload.message || 'Request failed', response.status, payload.errors, payload.data);
      }
      return payload.data as never;
    }
    return response.data;
  },
  (error: AxiosError<ApiEnvelope<unknown>>) => {
    const status = error.response?.status ?? 0;
    const payload = error.response?.data;

    if (status === 401 && !isAuthEndpoint(error.config?.url)) {
      clearToken();
      const path = window.location.pathname;
      if (!path.startsWith('/login') && !path.startsWith('/register')) {
        window.location.assign('/login');
      }
    }

    const message =
      payload?.message ||
      (status === 0
        ? 'Cannot reach the API server. Check that the backend is running and that VITE_API_URL points to it.'
        : typeof error.message === 'string' && error.message !== 'Request failed with status code 401'
          ? error.message
          : 'Your session has expired. Please sign in again.');
    throw new ApiError(message, status, payload?.errors, payload?.data);
  },
);

/** Axios `request<T, R>` lets us declare the unwrapped (interceptor) return type. */
function request<T>(config: AxiosRequestConfig): Promise<T> {
  return api.request<T, T>(config) as unknown as Promise<T>;
}

const get = <T>(url: string, params?: Record<string, unknown>) =>
  request<T>({ method: 'GET', url, params });
const post = <T>(url: string, data?: unknown) => request<T>({ method: 'POST', url, data });
const patch = <T>(url: string, data?: unknown) => request<T>({ method: 'PATCH', url, data });
const del = <T>(url: string, data?: unknown) => request<T>({ method: 'DELETE', url, data });

export const authApi = {
  register: (data: { name: string; email: string; password: string }) =>
    post<AuthResponse>('/auth/register', data),
  login: (data: { email: string; password: string }) => post<AuthResponse>('/auth/login', data),
  logout: () => post<{ message: string }>('/auth/logout'),
  me: () => get<User>('/auth/me'),
  updateMe: (data: { name?: string; phone?: string }) => patch<User>('/auth/me', data),
};

export const moviesApi = {
  list: (filters?: MovieFilters) => get<Movie[]>('/movies', filters as Record<string, unknown>),
  get: (id: string) => get<Movie>(`/movies/${id}`),
  create: (data: Partial<Movie>) => post<Movie>('/movies', data),
  update: (id: string, data: Partial<Movie>) => patch<Movie>(`/movies/${id}`, data),
  delete: (id: string) => del<{ message: string }>(`/movies/${id}`),
};

export const theatresApi = {
  list: (city?: string) => get<Theatre[]>('/theatres', city ? { city } : undefined),
  get: (id: string) => get<TheatreWithScreens>(`/theatres/${id}`),
  create: (data: Partial<Theatre>) => post<Theatre>('/theatres', data),
  update: (id: string, data: Partial<Theatre>) => patch<Theatre>(`/theatres/${id}`, data),
  delete: (id: string) => del<{ message: string }>(`/theatres/${id}`),
};

export const screensApi = {
  get: (id: string) => get<ScreenWithSeats>(`/screens/${id}`),
  byTheatre: (theatreId: string) => get<Screen[]>(`/theatres/${theatreId}/screens`),
  create: (theatreId: string, data: Partial<Screen>) =>
    post<Screen>(`/theatres/${theatreId}/screens`, data),
  update: (id: string, data: Partial<Screen>) => patch<Screen>(`/screens/${id}`, data),
  delete: (id: string) => del<{ message: string }>(`/screens/${id}`),
};

export const showsApi = {
  list: (filters?: ShowFilters) => get<Show[]>('/shows', filters as Record<string, unknown>),
  get: (id: string) => get<Show>(`/shows/${id}`),
  seats: (showId: string) => get<SeatAvailability>(`/shows/${showId}/seats`),
  create: (data: ShowInput) => post<Show>('/shows', data),
  update: (id: string, data: Partial<ShowInput>) => patch<Show>(`/shows/${id}`, data),
  delete: (id: string) => del<{ message: string }>(`/shows/${id}`),
};

export const holdsApi = {
  create: (showId: string, seats: string[]) =>
    post<HoldsResponse>(`/shows/${showId}/holds`, { seats }),
  release: (showId: string) => del<{ message: string }>(`/shows/${showId}/holds`),
};

export const promoApi = {
  validate: (code: string, amount: number) =>
    post<PromoValidation>('/promo/validate', { code, amount }),
};

export const bookingsApi = {
  create: (data: { showId: string; seats: string[]; promoCode?: string }) =>
    post<Booking>('/bookings', data),
  pay: (id: string, data: { method: PaymentMethod; outcome: PaymentOutcome }) =>
    post<{ booking: Booking; payment: Payment }>(`/bookings/${id}/pay`, data),
  mine: () => get<Booking[]>('/bookings/mine'),
  summary: () => get<CustomerDashboardSummary>('/bookings/summary'),
  get: (id: string) => get<Booking>(`/bookings/${id}`),
  ticket: (id: string) => get<TicketData>(`/bookings/${id}/ticket`),
  cancel: (id: string) => del<Booking>(`/bookings/${id}`),
};

export const paymentsApi = {
  get: (id: string) => get<Payment>(`/payments/${id}`),
};

export const adminApi = {
  overview: () => get<AdminOverview>('/admin/overview'),
  bookings: (filters?: BookingFilters) =>
    get<Booking[]>('/admin/bookings', filters as Record<string, unknown>),
  updateBooking: (id: string, data: { status: BookingStatus }) =>
    patch<Booking>(`/admin/bookings/${id}`, data),
  users: () => get<User[]>('/admin/users'),

  /** Uploads a movie poster as multipart/form-data and returns its served URL. */
  uploadPoster: (file: File): Promise<{ url: string; originalName: string }> => {
    const formData = new FormData();
    formData.append('poster', file);

    return request<{ url: string; originalName: string }>({
      method: 'POST',
      url: '/admin/uploads/poster',
      data: formData,
      // The axios instance sets application/json globally, which makes axios
      // serialise FormData into JSON. Removing it here lets the browser send
      // multipart/form-data with the correct boundary for multer.
      headers: { 'Content-Type': null },
    });
  },
};

export type { SeatCategory };
