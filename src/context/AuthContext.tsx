import React, { createContext, useContext, useEffect, useState, useRef } from 'react';
import { createClient, type Session, type User, SupabaseClient } from '@supabase/supabase-js';
import type {Database, Profile} from '../types/supabase';

interface AuthContextType {
  session: Session | null;
  user: User | null;
  profile: Profile | null;
  supabase: SupabaseClient<Database>;
  loading: boolean;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient<Database>(supabaseUrl, supabaseKey);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  const profileRef = useRef<Profile | null>(null);

  // Kijelentkezés
  const signOut = async () => {
    try {
      setLoading(true);
      await supabase.auth.signOut();
    } catch (error) {
      console.error("SignOut error:", error);
    } finally {
      // State törlése
      setSession(null);
      setUser(null);
      setProfile(null);
      profileRef.current = null;
      setLoading(false);
      // LocalStorage takarítás (hogy ne ragadjon be)
      localStorage.removeItem(`sb-${new URL(supabaseUrl).hostname.split('.')[0]}-auth-token`);
    }
  };

  const fetchProfile = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) {
        // Ha nincs profil (pl. törölve lett), kiléptetjük
        if (error.code === 'PGRST116') {
          await signOut();
        }
      } else {
        setProfile(data);
        profileRef.current = data;
      }
    } catch (error) {
      console.error('Kritikus profil hiba:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let mounted = true;

    // 1. Induláskor
    const initSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (mounted) {
        setSession(session);
        setUser(session?.user ?? null);
        if (session?.user) {
          await fetchProfile(session.user.id);
        } else {
          setLoading(false);
        }
      }
    };

    initSession();

    // 2. Eseményfigyelő
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (!mounted) return;

      // JAVÍTÁS: setTimeout használata a deadlock elkerülésére!
      // Ez hagyja, hogy a Supabase auth folyamat befejeződjön, mielőtt adatbázist hívunk.
      setTimeout(async () => {
        if (event === 'SIGNED_OUT') {
          setSession(null);
          setUser(null);
          setProfile(null);
          profileRef.current = null;
          setLoading(false);
          return;
        }

        if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
          setSession(session);
          setUser(session?.user ?? null);

          if (session?.user) {
            // Csak ha még nincs profil, vagy más user lépett be
            if (!profileRef.current || profileRef.current.id !== session.user.id) {
              setLoading(true);
              await fetchProfile(session.user.id);
            }
          } else {
            setLoading(false);
          }
        }
      }, 0);
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const value = {
    session,
    user,
    profile,
    supabase,
    loading,
    signOut,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}