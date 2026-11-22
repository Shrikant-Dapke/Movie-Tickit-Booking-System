import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { authApi, clearToken, getToken, setToken } from '@/api/client';
import type { User } from '@/types/api';

interface AuthContextValue {
  user: User | null;
  token: string | null;
  isAdmin: boolean;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<User>;
  register: (name: string, email: string, password: string) => Promise<User>;
  logout: () => Promise<void>;
  refreshMe: () => Promise<User | null>;
  updateProfile: (data: { name?: string; phone?: string }) => Promise<User>;
  setUser: (user: User | null) => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient();
  const [token, setTokenState] = useState<string | null>(() => getToken());
  const [user, setUser] = useState<User | null>(null);

  const meQuery = useQuery({
    queryKey: ['auth', 'me'],
    queryFn: authApi.me,
    enabled: !!token,
    retry: false,
    staleTime: 5 * 60 * 1000,
  });

  useEffect(() => {
    if (meQuery.data) setUser(meQuery.data);
  }, [meQuery.data]);

  useEffect(() => {
    if (meQuery.isError && token) {
      clearToken();
      setTokenState(null);
      setUser(null);
    }
  }, [meQuery.isError, token]);

  const login = useCallback(
    async (email: string, password: string) => {
      const result = await authApi.login({ email, password });
      setToken(result.token);
      setTokenState(result.token);
      setUser(result.user);
      queryClient.setQueryData(['auth', 'me'], result.user);
      return result.user;
    },
    [queryClient],
  );

  const register = useCallback(
    async (name: string, email: string, password: string) => {
      const result = await authApi.register({ name, email, password });
      setToken(result.token);
      setTokenState(result.token);
      setUser(result.user);
      queryClient.setQueryData(['auth', 'me'], result.user);
      return result.user;
    },
    [queryClient],
  );

  const logout = useCallback(async () => {
    try {
      await authApi.logout();
    } catch {
      // Local logout should always succeed even if the API call fails.
    } finally {
      clearToken();
      setTokenState(null);
      setUser(null);
      queryClient.removeQueries({ queryKey: ['auth', 'me'] });
      queryClient.removeQueries({ queryKey: ['bookings'] });
    }
  }, [queryClient]);

  const refreshMe = useCallback(async () => {
    if (!getToken()) return null;
    const result = await queryClient.fetchQuery({
      queryKey: ['auth', 'me'],
      queryFn: authApi.me,
      staleTime: 0,
    });
    setUser(result);
    return result;
  }, [queryClient]);

  const updateProfile = useCallback(
    async (data: { name?: string; phone?: string }) => {
      const result = await authApi.updateMe(data);
      setUser(result);
      queryClient.setQueryData(['auth', 'me'], result);
      return result;
    },
    [queryClient],
  );

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      token,
      isAdmin: user?.role === 'admin',
      isAuthenticated: !!token && !!user,
      isLoading: !!token && meQuery.isLoading,
      login,
      register,
      logout,
      refreshMe,
      updateProfile,
      setUser,
    }),
    [user, token, meQuery.isLoading, login, register, logout, refreshMe, updateProfile],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used inside <AuthProvider>');
  return context;
}
