import { Navigate, Route, Routes, useSearchParams } from 'react-router-dom';
import { AppLayout } from '@/layouts/AppLayout';
import { RequireAdmin, RequireAuth } from '@/components/RequireAuth';
import HomePage from '@/pages/HomePage';
import MovieDetailsPage from '@/pages/MovieDetailsPage';
import SeatSelectionPage from '@/pages/SeatSelectionPage';
import CheckoutPage from '@/pages/CheckoutPage';
import BookingConfirmationPage from '@/pages/BookingConfirmationPage';
import TicketPage from '@/pages/TicketPage';
import AuthPage from '@/pages/AuthPage';
import CustomerDashboardPage from '@/pages/CustomerDashboardPage';
import MyBookingsPage from '@/pages/MyBookingsPage';
import NotFoundPage from '@/pages/NotFoundPage';
import { AdminLayout } from '@/pages/Admin/AdminLayout';
import AdminOverviewPage from '@/pages/Admin/AdminOverviewPage';
import AdminMoviesPage from '@/pages/Admin/AdminMoviesPage';
import AdminTheatresPage from '@/pages/Admin/AdminTheatresPage';
import AdminScreensPage from '@/pages/Admin/AdminScreensPage';
import AdminShowsPage from '@/pages/Admin/AdminShowsPage';
import AdminBookingsPage from '@/pages/Admin/AdminBookingsPage';

// Older links used /dashboard?tab=bookings. Keep them working by redirecting
// to the dedicated bookings route, while /dashboard stays the overview page.
function DashboardRedirect() {
  const [params] = useSearchParams();
  if (params.get('tab') === 'bookings') return <Navigate to="/bookings" replace />;
  return <CustomerDashboardPage />;
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<AuthPage mode="login" />} />
      <Route path="/register" element={<AuthPage mode="register" />} />

      <Route element={<AppLayout />}>
        <Route index element={<HomePage />} />
        <Route path="movies/:id" element={<MovieDetailsPage />} />
        <Route
          path="shows/:showId/seats"
          element={
            <RequireAuth>
              <SeatSelectionPage />
            </RequireAuth>
          }
        />
        <Route
          path="checkout"
          element={
            <RequireAuth>
              <CheckoutPage />
            </RequireAuth>
          }
        />
        <Route
          path="booking/:id/confirmation"
          element={
            <RequireAuth>
              <BookingConfirmationPage />
            </RequireAuth>
          }
        />
        <Route
          path="ticket/:id"
          element={
            <RequireAuth>
              <TicketPage />
            </RequireAuth>
          }
        />
        <Route
          path="dashboard"
          element={
            <RequireAuth>
              <DashboardRedirect />
            </RequireAuth>
          }
        />
        <Route
          path="bookings"
          element={
            <RequireAuth>
              <MyBookingsPage />
            </RequireAuth>
          }
        />

        <Route
          path="admin"
          element={
            <RequireAdmin>
              <AdminLayout />
            </RequireAdmin>
          }
        >
          <Route index element={<AdminOverviewPage />} />
          <Route path="movies" element={<AdminMoviesPage />} />
          <Route path="theatres" element={<AdminTheatresPage />} />
          <Route path="screens" element={<AdminScreensPage />} />
          <Route path="shows" element={<AdminShowsPage />} />
          <Route path="bookings" element={<AdminBookingsPage />} />
        </Route>

        <Route path="*" element={<NotFoundPage />} />
      </Route>
    </Routes>
  );
}
