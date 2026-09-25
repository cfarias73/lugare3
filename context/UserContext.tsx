import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, Booking, Invitation } from '../types';
import { supabase } from '../lib/supabaseClient';

interface UserContextType {
  user: User | null;
  authReady: boolean;
  updateName: (name: string) => void;
  signIn: (email: string, password: string) => Promise<{ error: any }>;
  signUp: (email: string, password: string, name: string, role: 'user' | 'provider') => Promise<{ error: any }>;
  logout: () => Promise<void>;
  bookings: Booking[];
  addBooking: (booking: Booking) => void;
  invitations: Invitation[];
  addInvitation: (invitation: Invitation) => void;
  draftInvitation: Partial<Invitation> | null;
  updateDraftInvitation: (data: Partial<Invitation>) => void;
  favorites: string[];
  toggleFavorite: (venueId: string) => void;
  isFavorite: (venueId: string) => boolean;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

// Resolve role from user_roles table (admin > provider > user precedence)
const resolveRole = async (sessionUser: any): Promise<'user' | 'provider' | 'admin'> => {
  const { data, error } = await supabase
    .from('user_roles')
    .select('role')
    .eq('user_id', sessionUser.id);

  const roles: string[] = !error && data ? data.map((r: any) => r.role) : [];
  if (roles.includes('admin')) return 'admin';
  if (roles.includes('provider')) return 'provider';
  if (roles.includes('user')) return 'user';

  // Fallback: no row in user_roles yet (e.g. trigger missing).
  // Trust the role chosen at signup, but NEVER auto-grant admin from metadata.
  const metaRole = sessionUser.user_metadata?.role;
  if (metaRole === 'provider') return 'provider';
  return 'user';
};

const hydrateUser = async (sessionUser: any): Promise<User> => {
  const [profileRes, role] = await Promise.all([
    supabase.from('profiles').select('name').eq('id', sessionUser.id).maybeSingle(),
    resolveRole(sessionUser),
  ]);

  return {
    id: sessionUser.id,
    email: sessionUser.email!,
    name: profileRes.data?.name || sessionUser.user_metadata?.name || 'Usuario',
    isAuthenticated: true,
    role,
  };
};


export const UserProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [authReady, setAuthReady] = useState(false);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [invitations, setInvitations] = useState<Invitation[]>([]);
  const [draftInvitation, setDraftInvitation] = useState<Partial<Invitation> | null>(null);
  const [favorites, setFavorites] = useState<string[]>(() => {
    try {
      const raw = localStorage.getItem('user_favorites');
      return raw ? JSON.parse(raw) : [];
    } catch { return []; }
  });

  useEffect(() => {
    try { localStorage.setItem('user_favorites', JSON.stringify(favorites)); } catch {}
  }, [favorites]);

  const toggleFavorite = (venueId: string) => {
    setFavorites((prev) => prev.includes(venueId) ? prev.filter((id) => id !== venueId) : [...prev, venueId]);
  };
  const updateName = (name: string) => {
    setUser((currentUser) => currentUser ? { ...currentUser, name } : currentUser);
  };
  const isFavorite = (venueId: string) => favorites.includes(venueId);

  useEffect(() => {
    let mounted = true;
    let authChangeVersion = 0;

    const applySession = (session: any) => {
      const version = ++authChangeVersion;
      if (!session?.user) {
        setUser(null);
        setAuthReady(true);
        return;
      }

      // Defer Supabase calls to avoid deadlock inside the auth callback.
      setTimeout(async () => {
        try {
          const hydratedUser = await hydrateUser(session.user);
          if (mounted && version === authChangeVersion) setUser(hydratedUser);
        } catch (error) {
          console.error('[auth] could not restore user profile', error);
          if (mounted && version === authChangeVersion) {
            setUser({
              id: session.user.id,
              email: session.user.email || '',
              name: session.user.user_metadata?.name || 'Usuario',
              isAuthenticated: true,
              role: session.user.user_metadata?.role === 'provider' ? 'provider' : 'user',
            });
          }
        } finally {
          if (mounted && version === authChangeVersion) setAuthReady(true);
        }
      }, 0);
    };

    // Subscribe before reading the session so sign-in/sign-out events can't be missed.
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      applySession(session);
    });

    const versionBeforeGetSession = authChangeVersion;
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!mounted || authChangeVersion !== versionBeforeGetSession) return;
      applySession(session);
    }).catch((error) => {
      if (!mounted || authChangeVersion !== versionBeforeGetSession) return;
      console.error('[auth] could not restore session', error);
      setUser(null);
      setAuthReady(true);
    });

    return () => {
      mounted = false;
      authChangeVersion++;
      subscription.unsubscribe();
    };
  }, []);

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    return { error };
  };

  const signUp = async (email: string, password: string, name: string, role: 'user' | 'provider') => {
    const redirectUrl = `${window.location.origin}/`;
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: redirectUrl,
        data: { name, role },
      },
    });

    // Best-effort: persist the chosen role to user_roles so future logins and
    // admin listings see the user as an anfitrión. If RLS blocks the insert
    // (no self-insert policy), we silently fall back to user_metadata.role
    // in resolveRole().
    const newUserId = data?.user?.id;
    if (!error && newUserId) {
      try {
        await supabase.from('user_roles').insert({ user_id: newUserId, role });
      } catch (e) {
        console.warn('[signUp] could not write user_roles row', e);
      }
    }

    return { error };
  };


  const logout = async () => {
    await supabase.auth.signOut();
  };

  const addBooking = (booking: Booking) => setBookings((prev) => [booking, ...prev]);
  const addInvitation = (invitation: Invitation) => setInvitations((prev) => [invitation, ...prev]);

  const updateDraftInvitation = (data: Partial<Invitation>) => {
    setDraftInvitation((prev) => ({ ...prev, ...data }));
  };

  return (
    <UserContext.Provider value={{ user, authReady, updateName, signIn, signUp, logout, bookings, addBooking, invitations, addInvitation, draftInvitation, updateDraftInvitation, favorites, toggleFavorite, isFavorite }}>
      {children}
    </UserContext.Provider>
  );
};

export const useUser = () => {
  const context = useContext(UserContext);
  if (context === undefined) {
    throw new Error('useUser must be used within a UserProvider');
  }
  return context;
};
