import { useState } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { z } from 'zod';
import { ArrowRight, AtSign, KeyRound, LockKeyhole, ShieldCheck, UserRound } from 'lucide-react';
import { AuthLayout } from '@/layouts/AuthLayout';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { useToast } from '@/components/ui/Toast';
import { useAuth } from '@/store/auth';
import { ApiError } from '@/api/client';

const loginSchema = z.object({
  email: z.string().min(1, 'Email is required').email('Enter a valid email address'),
  password: z.string().min(1, 'Password is required'),
});

const registerSchema = z
  .object({
    name: z.string().trim().min(2, 'Name must be at least 2 characters'),
    email: z.string().min(1, 'Email is required').email('Enter a valid email address'),
    password: z.string().min(6, 'Password must be at least 6 characters'),
    confirmPassword: z.string().min(1, 'Please confirm your password'),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });

type LoginValues = z.infer<typeof loginSchema>;
type RegisterValues = z.infer<typeof registerSchema>;

export default function AuthPage({ mode }: { mode: 'login' | 'register' }) {
  const isLogin = mode === 'login';

  return (
    <AuthLayout>
      <div className="mb-8">
        <p className="mb-2 text-xs font-bold uppercase tracking-[0.25em] text-brand-500">
          {isLogin ? 'Welcome back' : 'Join CineBook'}
        </p>
        <h1 className="font-display text-5xl leading-none tracking-wide text-white sm:text-6xl">
          {isLogin ? 'SIGN IN' : 'CREATE ACCOUNT'}
        </h1>
        <p className="mt-3 text-sm text-slate-400">
          {isLogin
            ? 'Pick up right where your movie night left off.'
            : 'Book tickets faster and keep all your shows in one place.'}
        </p>
      </div>

      {isLogin ? <LoginForm /> : <RegisterForm />}

      <p className="mt-7 text-center text-sm text-slate-400">
        {isLogin ? "Don't have an account? " : 'Already have an account? '}
        <Link
          to={isLogin ? '/register' : '/login'}
          className="font-semibold text-brand-400 transition hover:text-brand-300"
        >
          {isLogin ? 'Create one' : 'Sign in'}
        </Link>
      </p>
    </AuthLayout>
  );
}

function LoginForm() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const toast = useToast();
  const [submitting, setSubmitting] = useState(false);
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors },
  } = useForm<LoginValues>({ resolver: zodResolver(loginSchema), defaultValues: { email: '', password: '' } });

  const onSubmit = async (values: LoginValues) => {
    setSubmitting(true);
    try {
      const user = await login(values.email.trim(), values.password);
      toast.success(`Welcome back, ${user.name.split(' ')[0]}!`, 'You are now signed in.');
      const from = (location.state as { from?: string } | null)?.from;
      navigate(from || (user.role === 'admin' ? '/admin' : '/'), { replace: true });
    } catch (error) {
      applyApiError(error, setError, toast);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
      <Input
        label="Email address"
        type="email"
        autoComplete="email"
        placeholder="you@example.com"
        icon={<AtSign className="h-4 w-4" />}
        error={errors.email?.message}
        disabled={submitting}
        {...register('email')}
      />
      <Input
        label="Password"
        type="password"
        autoComplete="current-password"
        placeholder="••••••••"
        icon={<KeyRound className="h-4 w-4" />}
        error={errors.password?.message}
        disabled={submitting}
        {...register('password')}
      />
      <Button type="submit" fullWidth size="lg" loading={submitting} rightIcon={<ArrowRight className="h-4 w-4" />}>
        Sign in
      </Button>

      <div className="rounded-xl border border-amber-500/20 bg-amber-500/[0.06] p-4 text-xs leading-relaxed text-slate-300">
        <p className="mb-2 flex items-center gap-2 font-semibold text-amber-300">
          <ShieldCheck className="h-4 w-4" /> Demo credentials
        </p>
        <p><span className="text-slate-400">Admin:</span> admin@cinebook.demo <span className="text-slate-400">/</span> Admin123!</p>
        <p className="mt-1 text-slate-500">Or create a customer account to book tickets.</p>
      </div>
    </form>
  );
}

function RegisterForm() {
  const { register: registerUser } = useAuth();
  const navigate = useNavigate();
  const toast = useToast();
  const [submitting, setSubmitting] = useState(false);
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors },
  } = useForm<RegisterValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: { name: '', email: '', password: '', confirmPassword: '' },
  });

  const onSubmit = async (values: RegisterValues) => {
    setSubmitting(true);
    try {
      const user = await registerUser(values.name.trim(), values.email.trim(), values.password);
      toast.success('Account created', `Welcome to CineBook, ${user.name.split(' ')[0]}!`);
      navigate('/', { replace: true });
    } catch (error) {
      applyApiError(error, setError, toast);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
      <Input
        label="Full name"
        autoComplete="name"
        placeholder="Aarav Sharma"
        icon={<UserRound className="h-4 w-4" />}
        error={errors.name?.message}
        disabled={submitting}
        {...register('name')}
      />
      <Input
        label="Email address"
        type="email"
        autoComplete="email"
        placeholder="you@example.com"
        icon={<AtSign className="h-4 w-4" />}
        error={errors.email?.message}
        disabled={submitting}
        {...register('email')}
      />
      <Input
        label="Password"
        type="password"
        autoComplete="new-password"
        placeholder="At least 6 characters"
        icon={<LockKeyhole className="h-4 w-4" />}
        error={errors.password?.message}
        disabled={submitting}
        {...register('password')}
      />
      <Input
        label="Confirm password"
        type="password"
        autoComplete="new-password"
        placeholder="Re-enter your password"
        icon={<LockKeyhole className="h-4 w-4" />}
        error={errors.confirmPassword?.message}
        disabled={submitting}
        {...register('confirmPassword')}
      />
      <Button type="submit" fullWidth size="lg" loading={submitting} rightIcon={<ArrowRight className="h-4 w-4" />}>
        Create account
      </Button>
    </form>
  );
}

function applyApiError(
  error: unknown,
  setError: (field: string, options: { message: string }) => void,
  toast: ReturnType<typeof useToast>,
) {
  if (error instanceof ApiError) {
    if (error.errors) {
      Object.entries(error.errors).forEach(([field, message]) => setError(field, { message }));
    }
    toast.error('Sign in failed', error.message);
  } else {
    toast.error('Something went wrong', 'Please try again in a moment.');
  }
}
