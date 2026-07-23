'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';

type AuthContextType = {
  user: any;
  profile: any;
  loading: boolean;
  signIn: (...args: any[]) => Promise<any>;
  signUp: (...args: any[]) => Promise<any>;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType>({
  user: null,
  profile: null,
  loading: true,
  signIn: async () => {},
  signUp: async () => {},
  signOut: async () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [mounted, setMounted] = useState(false);
  const router = useRouter();

  useEffect(() => {
    setMounted(true);

    const ensureProfile = async (user: any) => {
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('id, full_name, email, role, employee_id, position, department, phone, is_active')
        .eq('id', user.id)
        .maybeSingle();

      if (profileError) {
        throw profileError;
      }

      if (!profileData) {
        const { data: newProfile, error: createError } = await supabase
          .from('profiles')
          .insert([
            {
              id: user.id,
              full_name: user.user_metadata?.full_name ?? '',
              email: user.email,
              role: 'employee',
              employee_id: null,
              position: null,
              department: null,
              phone: null,
              is_active: true,
            },
          ])
          .select('id, full_name, email, role, employee_id, position, department, phone, is_active')
          .single();

        if (createError) {
          throw createError;
        }

        return newProfile;
      }

      return profileData;
    };

    const getUserData = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();

        if (session?.user) {
          setUser(session.user);
          const profileData = await ensureProfile(session.user);
          setProfile(profileData);
        } else {
          setUser(null);
          setProfile(null);
        }
      } catch (error) {
        console.error('Auth error:', error);
      } finally {
        setLoading(false);
      }
    };

    getUserData();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event: any, session: any) => {
        if (session?.user) {
          setUser(session.user);
          try {
            const profileData = await ensureProfile(session.user);
            setProfile(profileData);
          } catch (error) {
            console.error('Profile ensure error:', error);
            setProfile(null);
          }
        } else {
          setUser(null);
          setProfile(null);
        }
        setLoading(false);
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const signIn = async (email: string, password?: string) => {
    return await supabase.auth.signInWithPassword({ email, password: password || '' });
  };

  const signUp = async (email: string, password?: string, metadata?: any) => {
    return await supabase.auth.signUp({
      email,
      password: password || '',
      options: { data: metadata }
    });
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setProfile(null);
    router.push('/login');
  };

  if (!mounted) {
    return null;
  }

  return (
    <AuthContext.Provider value={{ user, profile, loading, signIn, signUp, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);