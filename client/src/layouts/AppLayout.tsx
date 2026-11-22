import { useEffect, useRef, useState, type ReactNode } from 'react';
import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom';
import {
  Clapperboard,
  LayoutDashboard,
  LogOut,
  Menu,
  ShieldCheck,
  Ticket,
  UserCircle2,
  X,
} from 'lucide-react';
import { useAuth } from '@/store/auth';
import { useToast } from '@/components/ui/Toast';
import { Button } from '@/components/ui/Button';
import { cn, getInitials } from '@/lib/utils';

export function Logo({ compact = false }: { compact?: boolean }) {
  return (
    <Link to="/" className="group inline-flex items-center gap-2.5" aria-label="CineBook home">
      <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand-500 text-white shadow-[0_6px_18px_-6px_rgba(229,9,20,0.9)] transition-transform group-hover:rotate-6">
        <Clapperboard className="h-5 w-5" />
      </span>
      <span className={cn('font-display tracking-wide', compact ? 'text-xl' : 'text-2xl')}>
        <span className="text-white">CINE</span>
        <span className="text-brand-500">BOOK</span>
      </span>
    </Link>
  );
}

const NAV_ITEMS = [
  { to: '/', label: 'Movies', key: 'movies' },
  { to: '/bookings', label: 'My Bookings', key: 'bookings' },
  { to: '/dashboard', label: 'Dashboard', key: 'dashboard' },
];

export function AppLayout() {
  const { user, isAuthenticated, isAdmin, logout } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  const location = useLocation();
  const toast = useToast();

  useEffect(() => {
    setMobileOpen(false);
    setMenuOpen(false);
  }, [location.pathname, location.search]);

  useEffect(() => {
    const onPointerDown = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) setMenuOpen(false);
    };
    document.addEventListener('mousedown', onPointerDown);
    return () => document.removeEventListener('mousedown', onPointerDown);
  }, []);

  const handleLogout = async () => {
    await logout();
    toast.success('Signed out', 'You have been logged out of CineBook.');
    navigate('/');
  };

  const isNavActive = (key: string) => {
    if (key === 'movies') return location.pathname === '/';
    if (key === 'bookings') return location.pathname === '/bookings';
    if (key === 'dashboard') return location.pathname === '/dashboard';
    return false;
  };

  const navClass = (active: boolean) =>
    cn(
      'relative rounded-lg px-3 py-2 text-sm font-medium transition-colors',
      active ? 'text-white' : 'text-slate-400 hover:text-white',
      'after:absolute after:inset-x-3 after:-bottom-1 after:h-0.5 after:rounded-full after:bg-brand-500 after:transition-transform',
      active ? 'after:scale-x-100' : 'after:scale-x-0',
    );

  return (
    <div className="flex min-h-screen flex-col">
      <header className="sticky top-0 z-40 border-b border-white/[0.07] glass">
        <div className="container-cine flex h-[72px] items-center justify-between gap-4">
          <Logo />

          <nav className="hidden items-center gap-1 lg:flex" aria-label="Main navigation">
            {NAV_ITEMS.map((item) => (
              <Link key={item.label} to={item.to} className={navClass(isNavActive(item.key))}>
                {item.label}
              </Link>
            ))}
            {isAdmin && (
              <Link to="/admin" className={navClass(location.pathname.startsWith('/admin'))}>
                Admin
              </Link>
            )}
          </nav>

          <div className="hidden items-center gap-3 lg:flex">
            {isAuthenticated && user ? (
              <div className="relative" ref={menuRef}>
                <button
                  type="button"
                  onClick={() => setMenuOpen((open) => !open)}
                  aria-expanded={menuOpen}
                  aria-haspopup="menu"
                  className="flex items-center gap-2.5 rounded-xl border border-white/10 bg-ink-800/70 py-1.5 pl-1.5 pr-3 transition hover:border-brand-500/40"
                >
                  <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-500/15 text-xs font-bold text-brand-300">
                    {getInitials(user.name)}
                  </span>
                  <span className="max-w-[120px] truncate text-sm font-medium text-slate-200">{user.name}</span>
                </button>
                {menuOpen && (
                  <div className="absolute right-0 top-[calc(100%+0.75rem)] w-56 overflow-hidden rounded-xl border border-white/10 bg-ink-850 p-1.5 shadow-2xl animate-fade-up" role="menu">
                    <div className="border-b border-white/[0.07] px-3 py-2.5">
                      <p className="truncate text-sm font-semibold text-white">{user.name}</p>
                      <p className="truncate text-xs text-slate-500">{user.email}</p>
                    </div>
                    <MenuLink to="/dashboard" icon={<LayoutDashboard className="h-4 w-4" />}>Dashboard</MenuLink>
                    <MenuLink to="/bookings" icon={<Ticket className="h-4 w-4" />}>My bookings</MenuLink>
                    {isAdmin && (
                      <MenuLink to="/admin" icon={<ShieldCheck className="h-4 w-4" />}>Admin panel</MenuLink>
                    )}
                    <button
                      type="button"
                      onClick={handleLogout}
                      className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-left text-sm text-brand-300 transition hover:bg-brand-500/10"
                      role="menuitem"
                    >
                      <LogOut className="h-4 w-4" /> Sign out
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <>
                <Link to="/login" className="text-sm font-semibold text-slate-300 transition hover:text-white">
                  Sign in
                </Link>
                <Link
                  to="/register"
                  className="inline-flex h-10 items-center rounded-xl bg-brand-500 px-4 text-sm font-semibold text-white transition hover:bg-brand-400"
                >
                  Create account
                </Link>
              </>
            )}
          </div>

          <button
            type="button"
            onClick={() => setMobileOpen((open) => !open)}
            className="rounded-lg border border-white/10 p-2 text-slate-300 lg:hidden"
            aria-label={mobileOpen ? 'Close menu' : 'Open menu'}
            aria-expanded={mobileOpen}
          >
            {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>

        {mobileOpen && (
          <div className="border-t border-white/[0.07] bg-ink-900/95 p-4 lg:hidden animate-fade-up">
            <nav className="flex flex-col gap-1" aria-label="Mobile navigation">
              {NAV_ITEMS.map((item) => (
                <Link
                  key={item.label}
                  to={item.to}
                  className={cn(
                    'rounded-lg px-3 py-2.5 text-sm font-medium',
                    isNavActive(item.key) ? 'bg-brand-500/10 text-white' : 'text-slate-400',
                  )}
                >
                  {item.label}
                </Link>
              ))}
              {isAdmin && (
                <Link
                  to="/admin"
                  className={cn(
                    'rounded-lg px-3 py-2.5 text-sm font-medium',
                    location.pathname.startsWith('/admin') ? 'bg-brand-500/10 text-white' : 'text-slate-400',
                  )}
                >
                  Admin
                </Link>
              )}
            </nav>
            <div className="mt-4 border-t border-white/[0.07] pt-4">
              {isAuthenticated && user ? (
                <div className="space-y-2">
                  <div className="flex items-center gap-2 px-1 text-sm text-slate-300">
                    <UserCircle2 className="h-5 w-5 text-brand-400" /> {user.name}
                  </div>
                  <Button variant="outline" fullWidth onClick={handleLogout} leftIcon={<LogOut className="h-4 w-4" />}>
                    Sign out
                  </Button>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-2">
                  <Link to="/login" className="flex h-11 items-center justify-center rounded-xl border border-white/15 text-sm font-semibold text-slate-200">
                    Sign in
                  </Link>
                  <Link to="/register" className="flex h-11 items-center justify-center rounded-xl bg-brand-500 text-sm font-semibold text-white">
                    Register
                  </Link>
                </div>
              )}
            </div>
          </div>
        )}
      </header>

      <main className="flex-1">
        <Outlet />
      </main>

      <footer className="mt-20 border-t border-white/[0.07] bg-ink-900/50">
        <div className="container-cine grid gap-8 py-12 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <Logo compact />
            <p className="mt-4 max-w-xs text-sm leading-relaxed text-slate-400">
              Your front-row seat to the big screen. Discover movies, pick your favourite seats and book in seconds.
            </p>
          </div>
          <FooterColumn title="Explore" links={[{ label: 'Now showing', to: '/' }, { label: 'My bookings', to: '/bookings' }, { label: 'Dashboard', to: '/dashboard' }]} />
          <FooterColumn title="Account" links={[{ label: 'Sign in', to: '/login' }, { label: 'Create account', to: '/register' }, ...(isAdmin ? [{ label: 'Admin panel', to: '/admin' }] : [])]} />
          <div>
            <h3 className="mb-4 text-sm font-semibold text-white">Good to know</h3>
            <p className="text-sm leading-relaxed text-slate-400">
              Payments on CineBook are <span className="font-semibold text-amber-300">simulated for demonstration</span>. No real money is ever charged.
            </p>
          </div>
        </div>
        <div className="border-t border-white/[0.07] py-5 text-center text-xs text-slate-500">
          © {new Date().getFullYear()} CineBook. Built for the big screen.
        </div>
      </footer>
    </div>
  );
}

function MenuLink({ to, icon, children }: { to: string; icon: ReactNode; children: ReactNode }) {
  return (
    <Link to={to} className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm text-slate-300 transition hover:bg-white/[0.06] hover:text-white" role="menuitem">
      {icon} {children}
    </Link>
  );
}

function FooterColumn({ title, links }: { title: string; links: Array<{ label: string; to: string }> }) {
  return (
    <div>
      <h3 className="mb-4 text-sm font-semibold text-white">{title}</h3>
      <ul className="space-y-2.5">
        {links.map((link) => (
          <li key={link.label}>
            <Link to={link.to} className="text-sm text-slate-400 transition hover:text-brand-400">
              {link.label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
