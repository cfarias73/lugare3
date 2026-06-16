import { supabase } from '../../lib/supabaseClient';
import { createNotification } from './notificationService';

export const getAdminStats = async () => {
  const [usersRes, providersRes, bookingsRes, todayRes, revenueRes] = await Promise.all([
    supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('role', 'user'),
    supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('role', 'provider'),
    supabase.from('bookings').select('*', { count: 'exact', head: true }),
    supabase.from('bookings').select('*', { count: 'exact', head: true }).eq('event_date', new Date().toISOString().slice(0, 10)),
    supabase.from('bookings').select('total_price').eq('status', 'completed'),
  ]);
  const revenue = (revenueRes.data || []).reduce((s: number, b: any) => s + Number(b.total_price || 0), 0);
  return {
    userCount: usersRes.count || 0,
    providerCount: providersRes.count || 0,
    bookingCount: bookingsRes.count || 0,
    todayBookings: todayRes.count || 0,
    revenue,
  };
};

export const getAllUsers = async () => {
  const { data, error } = await supabase
    .from('profiles')
    .select('id, name, email, created_at')
    .eq('role', 'user')
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data || [];
};

export const updateUserName = async (userId: string, name: string) => {
  const { error } = await supabase.from('profiles').update({ name }).eq('id', userId);
  if (error) throw error;
};

export const deleteUserProfile = async (userId: string) => {
  const { error } = await supabase.from('profiles').delete().eq('id', userId);
  if (error) throw error;
};

export const getAllHosts = async () => {
  const { data, error } = await supabase
    .from('profiles')
    .select('id, name, email, created_at, venues(id)')
    .eq('role', 'provider')
    .order('created_at', { ascending: false });
  if (error) throw error;
  return (data || []).map((h: any) => ({ ...h, spaces: h.venues?.length || 0 }));
};

export const getAllBookings = async () => {
  const { data, error } = await supabase
    .from('bookings')
    .select('id, event_date, status, total_price, venues(name), profiles(name, email)')
    .order('event_date', { ascending: false })
    .limit(100);
  if (error) throw error;
  return data || [];
};

export const cancelBooking = async (bookingId: string) => {
  const { data: booking, error } = await supabase
    .from('bookings')
    .update({ status: 'cancelled' })
    .eq('id', bookingId)
    .select('user_id, venues(name)')
    .maybeSingle();
  if (error) throw error;
  if (booking?.user_id) {
    try {
      await createNotification({
        userId: booking.user_id,
        title: 'Reserva cancelada',
        message: `Tu reserva en "${(booking as any).venues?.name || 'el espacio'}" fue cancelada por administración.`,
        type: 'warning',
        link: '/user/bookings',
      });
    } catch (e) { console.error(e); }
  }
};

export const getAllVenuesAdmin = async () => {
  const { data, error } = await supabase
    .from('venues')
    .select('id, name, status, city, profiles(name, email)')
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data || [];
};

export const getPendingVenues = async () => {
  const { data, error } = await supabase
    .from('venues')
    .select(`
      *,
      profiles (name, email)
    `)
    .eq('status', 'pending');

  if (error) throw error;
  return data;
};

export const approveVenue = async (venueId: string) => {
  const { data: venue, error } = await supabase
    .from('venues')
    .update({ status: 'approved' })
    .eq('id', venueId)
    .select('name, provider_id')
    .maybeSingle();

  if (error) throw error;

  // Notificar al anfitrión
  if (venue?.provider_id) {
    try {
      await createNotification({
        userId: venue.provider_id,
        title: 'Espacio aprobado',
        message: `Tu espacio "${venue.name}" fue aprobado y ya es visible para los huéspedes.`,
        type: 'success',
        link: '/provider/spaces',
      });
    } catch (e) {
      console.error('notify approve failed', e);
    }
  }
};

export const rejectVenue = async (venueId: string, reason?: string) => {
  const { data: venue, error } = await supabase
    .from('venues')
    .update({ status: 'rejected' })
    .eq('id', venueId)
    .select('name, provider_id')
    .maybeSingle();

  if (error) throw error;

  if (venue?.provider_id) {
    try {
      await createNotification({
        userId: venue.provider_id,
        title: 'Espacio rechazado',
        message: `Tu espacio "${venue.name}" no fue aprobado.${reason ? ` Motivo: ${reason}` : ''}`,
        type: 'error',
        link: '/provider/spaces',
      });
    } catch (e) {
      console.error('notify reject failed', e);
    }
  }
};
