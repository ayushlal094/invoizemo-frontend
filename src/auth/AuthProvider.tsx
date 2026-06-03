import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  type ReactNode,
} from 'react';
import { client } from '../lib/api/client';
import { refreshClient } from '../lib/api/refreshClient';
import { tokenStore } from './tokenStore';

export interface AuthUser {
  _id: string;
  email: string;
  name: string;
  role: 'owner' | 'admin' | 'member';
  defaultCurrency: string;
  timezone: string;
}

interface AuthContextValue {
  user: AuthUser | null;
  loading: boolean;
  setUser: (user: AuthUser | null) => void;
  login: (accessToken: string, user: AuthUser) => void;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  // Bootstrap: try to use the HttpOnly refresh cookie to get a fresh access token,
  // then fetch the user profile. Called once on app mount.
  useEffect(() => {
    let cancelled = false;

    async function bootstrap() {
      try {
        // 1. Attempt silent refresh using the existing cookie
        const refreshRes = await refreshClient.post<{ data: { accessToken: string } }>(
          '/auth/refresh'
        );
        tokenStore.set(refreshRes.data.data.accessToken);

        // 2. Fetch current user profile
        const meRes = await client.get<{ data: AuthUser }>('/users/me');
        if (!cancelled) setUser(meRes.data.data);
      } catch {
        // No valid session — user stays null, will be redirected by RequireAuth
        tokenStore.clear();
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    bootstrap();
    return () => {
      cancelled = true;
    };
  }, []);

  const login = useCallback((accessToken: string, loggedInUser: AuthUser) => {
    tokenStore.set(accessToken);
    setUser(loggedInUser);
  }, []);

  const logout = useCallback(async () => {
    try {
      await client.post('/auth/logout');
    } catch {
      // Best effort — always clear local state
    } finally {
      tokenStore.clear();
      setUser(null);
    }
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading, setUser, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
