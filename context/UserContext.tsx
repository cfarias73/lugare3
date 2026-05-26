import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, Booking, Invitation, Message } from '../types';
import { supabase } from '../lib/supabaseClient';

interface UserContextType {
  user: User | null;
  signIn: (email: string, password: string) => Promise<{ error: any }>;
  signUp: (email: string, password: string, name: string, role: 'user' | 'provider') => Promise<{ error: any }>;
  logout: () => Promise<void>;
  bookings: Booking[];
  addBooking: (booking: Booking) => void;
  invitations: Invitation[];
  addInvitation: (invitation: Invitation) => void;
  messages: Message[];
  sendMessage: (content: string, venueName?: string) => void;
  draftInvitation: Partial<Invitation> | null;
  updateDraftInvitation: (data: Partial<Invitation>) => void;
  favorites: string[];
  toggleFavorite: (venueId: string) => void;
  isFavorite: (venueId: string) => boolean;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

// Resolve role from user_roles table (admin > provider > user precedence)
const resolveRole = async (userId: string): Promise<'user' | 'provider' | 'admin'> => {
  const { data, error } = await supabase
    .from('user_roles')
    .select('role')
    .eq('user_id', userId);

  if (error || !data || data.length === 0) return 'user';
  const roles = data.map((r: any) => r.role);
  if (roles.includes('admin')) return 'admin';
  if (roles.includes('provider')) return 'provider';
  return 'user';
};

const hydrateUser = async (sessionUser: any): Promise<User> => {
  const [{ data: profile }, role] = await Promise.all([
    supabase.from('profiles').select('name').eq('id', sessionUser.id).single(),
    resolveRole(sessionUser.id),
  ]);

  return {
    id: sessionUser.id,
    email: sessionUser.email!,
    name: profile?.name || sessionUser.user_metadata?.name || 'Usuario',
    isAuthenticated: true,
    role,
  };
};

export const UserProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [invitations, setInvitations] = useState<Invitation[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
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
  const isFavorite = (venueId: string) => favorites.includes(venueId);

  useEffect(() => {
    // IMPORTANT: set up listener BEFORE getSession (avoids race conditions)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        // Defer Supabase calls to avoid deadlock inside the callback
        setTimeout(() => {
          hydrateUser(session.user).then(setUser);
        }, 0);
      } else {
        setUser(null);
      }
    });

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        hydrateUser(session.user).then(setUser);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    return { error };
  };

  const signUp = async (email: string, password: string, name: string, role: 'user' | 'provider') => {
    const redirectUrl = `${window.location.origin}/`;
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: redirectUrl,
        data: { name, role },
      },
    });
    return { error };
  };

  const logout = async () => {
    await supabase.auth.signOut();
  };

  const addBooking = (booking: Booking) => setBookings((prev) => [booking, ...prev]);
  const addInvitation = (invitation: Invitation) => setInvitations((prev) => [invitation, ...prev]);

  const sendMessage = (content: string, venueName: string = 'Soporte') => {
    const newMessage: Message = {
      id: Date.now().toString(),
      sender: 'Tú',
      avatar: 'https://ui-avatars.com/api/?name=You&background=random',
      content,
      time: 'Ahora',
      venueName,
      isOnline: true,
    };
    setMessages((prev) => [newMessage, ...prev]);
  };

  const updateDraftInvitation = (data: Partial<Invitation>) => {
    setDraftInvitation((prev) => ({ ...prev, ...data }));
  };

  return (
    <UserContext.Provider value={{ user, signIn, signUp, logout, bookings, addBooking, invitations, addInvitation, messages, sendMessage, draftInvitation, updateDraftInvitation, favorites, toggleFavorite, isFavorite }}>
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
