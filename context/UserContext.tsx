import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, Booking, Invitation, Message } from '../types';
import { MOCK_BOOKINGS, MOCK_MESSAGES } from '../constants';
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
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export const UserProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [bookings, setBookings] = useState<Booking[]>(MOCK_BOOKINGS);
  const [invitations, setInvitations] = useState<Invitation[]>([]);
  const [messages, setMessages] = useState<Message[]>(MOCK_MESSAGES);
  const [draftInvitation, setDraftInvitation] = useState<Partial<Invitation> | null>(null);

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (session) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('role, name')
          .eq('id', session.user.id)
          .single();

        setUser({
          email: session.user.email!,
          name: profile?.name || session.user.user_metadata.name || 'Usuario',
          isAuthenticated: true,
          role: profile?.role || session.user.user_metadata.role || 'user',
        });
      }
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (session) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('role, name')
          .eq('id', session.user.id)
          .single();

        setUser({
          email: session.user.email!,
          name: profile?.name || session.user.user_metadata.name || 'Usuario',
          isAuthenticated: true,
          role: profile?.role || session.user.user_metadata.role || 'user',
        });
      } else {
        setUser(null);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const signIn = async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    return { error };
  };

  const signUp = async (email: string, password: string, name: string, role: 'user' | 'provider') => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { name, role },
      },
    });
    return { error };
  };

  const logout = async () => {
    await supabase.auth.signOut();
  };

  const addBooking = (booking: Booking) => {
    setBookings((prev) => [booking, ...prev]);
  };

  const addInvitation = (invitation: Invitation) => {
    setInvitations((prev) => [invitation, ...prev]);
  };

  const sendMessage = (content: string, venueName: string = 'Soporte') => {
    const newMessage: Message = {
      id: Date.now().toString(),
      sender: 'Tú', // Or user.name
      avatar: 'https://ui-avatars.com/api/?name=You&background=random', // Placeholder
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
    <UserContext.Provider value={{ user, signIn, signUp, logout, bookings, addBooking, invitations, addInvitation, messages, sendMessage, draftInvitation, updateDraftInvitation }}>
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
