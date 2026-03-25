import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { Session, User } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';

interface AuthContextType {
  session: Session | null;
  user: User | null;
  isAdmin: boolean;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);
const ADMIN_EMAIL = 'jpvanoofc@gmail.com';

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  const checkAdmin = async (userId: string, email?: string | null) => {
    try {
      const { data, error } = await supabase.rpc('has_role', {
        _user_id: userId,
        _role: 'admin',
      });

      if (error) {
        console.error('Erro ao verificar admin:', error);
        const fallbackAdmin = email === ADMIN_EMAIL;
        setIsAdmin(fallbackAdmin);
        return fallbackAdmin;
      }

      const admin = !!data || email === ADMIN_EMAIL;
      setIsAdmin(admin);
      return admin;
    } catch (error) {
      console.error('Falha ao verificar admin:', error);
      const fallbackAdmin = email === ADMIN_EMAIL;
      setIsAdmin(fallbackAdmin);
      return fallbackAdmin;
    }
  };

  useEffect(() => {
    let isMounted = true;
    let initialized = false;

    // 1. Restore session from storage FIRST
    supabase.auth.getSession().then(({ data: { session: currentSession } }) => {
      if (!isMounted) return;
      initialized = true;
      setSession(currentSession);
      setUser(currentSession?.user ?? null);
      if (currentSession?.user) {
        checkAdmin(currentSession.user.id, currentSession.user.email).finally(() => {
          if (isMounted) setLoading(false);
        });
      } else {
        setLoading(false);
      }
    });

    // 2. Listen for auth changes — only act on meaningful events
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, currentSession) => {
        if (!isMounted) return;
        // Skip initial event (handled by getSession) and token refreshes (no state change needed)
        if (event === 'INITIAL_SESSION') return;
        if (event === 'TOKEN_REFRESHED') {
          // Just update session/user refs without triggering admin check
          setSession(currentSession);
          setUser(currentSession?.user ?? null);
          return;
        }

        setSession(currentSession);
        setUser(currentSession?.user ?? null);

        if (event === 'SIGNED_IN' && currentSession?.user) {
          setTimeout(() => {
            if (!isMounted) return;
            checkAdmin(currentSession.user.id, currentSession.user.email);
          }, 0);
        } else if (event === 'SIGNED_OUT') {
          setIsAdmin(false);
        }

        if (initialized) setLoading(false);
      }
    );

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
  };

  const signUp = async (email: string, password: string) => {
    const { error } = await supabase.auth.signUp({ email, password });
    if (error) throw error;
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setIsAdmin(false);
  };

  return (
    <AuthContext.Provider value={{ session, user, isAdmin, loading, signIn, signUp, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};
