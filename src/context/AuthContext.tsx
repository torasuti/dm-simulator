import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import type { User } from '@supabase/supabase-js';
import { CLOUD_FEATURES_ENABLED } from '../config/features';

interface AuthContextValue {
  user: User | null;
  loading: boolean;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);
const AUTH_LOADING_TIMEOUT_MS = 5000;

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(CLOUD_FEATURES_ENABLED);

  useEffect(() => {
    if (!CLOUD_FEATURES_ENABLED) {
      setUser(null);
      setLoading(false);
      return;
    }

    let active = true;
    let unsubscribe: (() => void) | undefined;
    const loadingTimeout = setTimeout(() => {
      if (!active) return;
      setUser(null);
      setLoading(false);
    }, AUTH_LOADING_TIMEOUT_MS);

    import('../lib/supabase').then(({ supabase }) => {
      if (!active) return;
      supabase.auth.getSession()
        .then(({ data }) => {
          if (!active) return;
          setUser(data.session?.user ?? null);
        })
        .catch(() => {
          if (!active) return;
          setUser(null);
        })
        .finally(() => {
          clearTimeout(loadingTimeout);
          if (active) setLoading(false);
        });
      const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
        setUser(session?.user ?? null);
      });
      unsubscribe = () => subscription.unsubscribe();
    }).catch(() => {
      clearTimeout(loadingTimeout);
      if (active) setLoading(false);
    });
    return () => {
      active = false;
      clearTimeout(loadingTimeout);
      unsubscribe?.();
    };
  }, []);

  async function signOut() {
    if (!CLOUD_FEATURES_ENABLED) return;
    const { supabase } = await import('../lib/supabase');
    await supabase.auth.signOut();
  }

  return (
    <AuthContext.Provider value={{ user, loading, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
