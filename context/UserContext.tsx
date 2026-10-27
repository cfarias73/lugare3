import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { User, Booking, Invitation } from '../types';
import { supabase } from '../lib/supabaseClient';
import { listInvitations } from '../src/services/invitationService';
import { getUserBookings } from '../src/services/userService';
import { formatLocalDate } from '../src/utils/date';

interface UserContextType {
  user: User | null;
  authReady: boolean;
  updateName: (name: string) => void;
  signIn: (email: string, password: string) => Promise<{ error: any }>;
  signUp: (email: string, password: string, name: string, role: 'user' | 'provider') => Promise<{ error: any }>;
  logout: () => Promise<void>;
  bookings: Booking[];
  addBooking: (booking: Booking) => void;
  refreshBookings: () => Promise<void>;
  invitations: Invitation[];
  addInvitation: (invitation: Invitation) => void;
  refreshInvitations: () => Promise<void>;
  draftInvitation: Partial<Invitation> | null;
  updateDraftInvitation: (data: Partial<Invitation> | null) => void;
  clearDraftInvitation: () => void;
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

const mapDbBooking = (b: any): Booking => {
  const STATUS_LABELS: Record<string, 'Confirmada' | 'Pendiente' | 'Cancelada'> = {
    confirmed: 'Confirmada',
    paid: 'Confirmada',
    pending: 'Pendiente',
    cancelled: 'Cancelada',
  };
  const STATUS_COLORS: Record<string, string> = {
    confirmed: '#00B4BB',
    paid: '#00B4BB',
    pending: '#F59E0B',
    cancelled: '#EF4444',
  };

  const formattedDate = formatLocalDate(b.event_date, {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }, 'es-MX');

  const startTime = b.start_time ? String(b.start_time).slice(0, 5) : '';
  const endTime = b.end_time ? String(b.end_time).slice(0, 5) : '';
  const timeStr = startTime && endTime ? `${startTime} - ${endTime}` : startTime;

  return {
    id: b.id,
    venueName: b.venues?.name || 'Espacio',
    location: b.venues?.location || '',
    image: b.venues?.venue_images?.[0]?.image_url || 'https://images.unsplash.com/photo-1519167758481-83f5e181dcc3?auto=format&fit=crop&q=80&w=800',
    date: formattedDate,
    time: timeStr,
    totalPrice: Number(b.total_price) || 0,
    status: STATUS_LABELS[b.status] || 'Pendiente',
    statusColor: STATUS_COLORS[b.status] || '#00B4BB',
    eventDate: b.event_date || '',
    rawStatus: b.status || '',
  };
};

const mapDbInvitation = (r: any): Invitation => ({
  id: r.id,
  designId: r.design_id,
  eventName: r.event_name,
  date: r.event_date || '',
  time: r.event_time || '',
  location: r.location || '',
  guests: (r.invitation_guests || r.guests || []).map((g: any) => ({
    id: g.id,
    name: g.name,
    email: g.email,
  })),
  coverImage: r.cover_image_url,
});

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

  const clearUserData = () => {
    setUser(null);
    setBookings([]);
    setInvitations([]);
    setDraftInvitation(null);
    setFavorites([]);
    try {
      localStorage.removeItem('user_profile');
      localStorage.removeItem('user_avatar');
      localStorage.removeItem('user_notifications');
      localStorage.removeItem('user_favorites');
    } catch {}
  };

  useEffect(() => {
    let mounted = true;
    let authChangeVersion = 0;

    const applySession = (session: any) => {
      const version = ++authChangeVersion;
      if (!session?.user) {
        clearUserData();
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
      clearUserData();
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
    clearUserData();
    try {
      await supabase.auth.signOut();
    } catch (err) {
      console.warn('[auth] error during signOut:', err);
    }
  };

  const refreshInvitations = useCallback(async () => {
    if (!user?.id) return;
    try {
      const data = await listInvitations(user.id);
      setInvitations((data || []).map(mapDbInvitation));
    } catch (e) {
      console.error('[UserContext] Error al refrescar invitaciones:', e);
    }
  }, [user?.id]);

  const refreshBookings = useCallback(async () => {
    if (!user?.id) return;
    try {
      const data = await getUserBookings(user.id);
      setBookings((data || []).map(mapDbBooking));
    } catch (e) {
      console.error('[UserContext] Error al refrescar reservas:', e);
    }
  }, [user?.id]);

  useEffect(() => {
    if (user?.id) {
      refreshInvitations();
      refreshBookings();
    }
  }, [user?.id, refreshInvitations, refreshBookings]);

  const addBooking = (booking: Booking) => {
    setBookings((prev) => [booking, ...prev]);
    refreshBookings();
  };

  const addInvitation = (invitation: Invitation) => {
    setInvitations((prev) => [invitation, ...prev]);
    refreshInvitations();
  };

  const clearDraftInvitation = () => {
    setDraftInvitation(null);
  };

  const updateDraftInvitation = (data: Partial<Invitation> | null) => {
    if (data === null || Object.keys(data).length === 0) {
      setDraftInvitation(null);
      return;
    }
    setDraftInvitation((prev) => ({ ...(prev || {}), ...data }));
  };

  return (
    <UserContext.Provider value={{ user, authReady, updateName, signIn, signUp, logout, bookings, addBooking, refreshBookings, invitations, addInvitation, refreshInvitations, draftInvitation, updateDraftInvitation, clearDraftInvitation, favorites, toggleFavorite, isFavorite }}>
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
