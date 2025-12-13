import { createContext, useContext, useEffect, useState } from 'react';
import { User } from '@supabase/supabase-js';
import { supabase, Profile } from '../lib/supabase';
import { api } from '../lib/api';
interface AuthContextType {
  user: User | null;
  profile: Profile | null;
  loading: boolean;
  isAdmin: boolean;
  signIn: (email: string, password: string) => Promise<any>;
  signUp: (email: string, password: string, name: string, rollNumber: string) => Promise<any>;
  logout: () => Promise<void>;
  refreshProfile: () => Promise<void>;
  updateProfile: (updates: Partial<Profile>) => Promise<void>;
  dbError: string | null; // New field for critical DB errors
}
const AuthContext = createContext<AuthContextType | undefined>(undefined);
export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [dbError, setDbError] = useState<string | null>(null);
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchProfile(session.user.id);
      } else {
        setLoading(false);
      }
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchProfile(session.user.id);
      } else {
        setProfile(null);
        setLoading(false);
      }
    });
    return () => subscription.unsubscribe();
  }, []);

  // Global Presence Tracking (DISABLED per user request to fix WebSocket errors)
  /*
  useEffect(() => {
    if (!user) return;
    const channel = supabase.channel('global_presence')
      .on('presence', { event: 'sync' }, () => {
        // We can handle global sync here if needed, but mostly we just track self.
      })
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          await channel.track({
            user_id: user.id,
            online_at: new Date().toISOString()
          });
        }
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);
  */
  const fetchProfile = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .maybeSingle();
      if (error) {
        console.error('Error fetching profile:', error);
        if (error.code === '42P17' || error.message?.includes('infinite recursion')) {
          setDbError('recursive_policy');
        }
      } else {
        setProfile(data);
        setDbError(null);
      }
    } catch (error: any) {
      console.error('Unexpected error fetching profile:', error);
    } finally {
      setLoading(false);
    }
  };
  const signUp = async (email: string, password: string, name: string, rollNumber: string) => {
    console.log('[AuthContext] Attempting Supabase Auth Sign Up:', email);
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          name,
          roll_number: rollNumber,
        },
      },
    });
    if (error) {
      console.error('[AuthContext] Supabase Auth Sign Up FAILED:', error);
      throw error;
    }
    console.log('[AuthContext] Supabase Auth Sign Up SUCCESS. User:', data.user?.id);
    // CRITICAL: If session is null (due to Email Confirm settings), we must Force Login
    // because our Trigger has already confirmed the email in the background.
    if (data.user && !data.session) {
      console.log('[AuthContext] SignUp successful but no session. Attempting Force Login...');
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (signInError) {
        console.warn('[AuthContext] Force Login FAILED (likely email not confirmed yet):', signInError);
        alert("Account created! Please check your email to confirm, then Log In.");
      } else {
        console.log('[AuthContext] Force Login SUCCESS. Session obtained.');
      }
    }
    if (data.user) {
      // Profile creation is now handled by a Database Trigger on auth.users!
      // However, as a backup (in case trigger migration wasn't run), we attempt an upsert.
      console.log('[AuthContext] Attempting Client-side Profile Upsert (Backup)...');
      // We must check if we have a session now (from initial signup or force login)
      const { data: currentSession } = await supabase.auth.getSession();
      if (currentSession?.session) {
        // LOG SIGNUP
        api.logUserAction('SIGNUP', { email, name, rollNumber }).catch(console.error);

        const { error: profileError } = await supabase
          .from('profiles')
          .upsert({
            id: data.user.id,
            name,
            roll_number: rollNumber,
          }, { onConflict: 'id' });
        if (profileError) {
          console.warn("[AuthContext] Manual profile creation WARNING (likely Trigger worked, so we ignore):", profileError);
        } else {
          console.log('[AuthContext] Client-side Profile Upsert SUCCESS or No-Op.');
        }
      } else {
        console.warn('[AuthContext] Still no session after signup. Skipping backup profile creation.');
      }
    }
  };
  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (error) throw error;
    // LOG LOGIN
    api.logUserAction('LOGIN', { email }).catch(console.error);
  };
  const signOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setProfile(null);
    setLoading(true); // Reset loading state for next login
    window.location.reload();
  };
  const refreshProfile = async () => {
    if (user) await fetchProfile(user.id);
  };

  const updateProfile = async (updates: Partial<Profile>) => {
    if (!user) return;
    const { error } = await supabase
      .from('profiles')
      .update(updates)
      .eq('id', user.id);

    if (error) throw error;
    await fetchProfile(user.id);
  };

  const value = {
    user,
    profile,
    loading,
    isAdmin: profile?.is_admin || false,
    signIn,
    signUp,
    logout: signOut,
    refreshProfile: () => {
      if (user) return fetchProfile(user.id);
      return Promise.resolve();
    },
    updateProfile,
    dbError,
  };
  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}
export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
