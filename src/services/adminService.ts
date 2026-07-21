import { supabase } from '../../lib/supabaseClient';
import { createNotification } from './notificationService';

type AppRole = 'user' | 'provider' | 'admin';

const unique = <T,>(items: T[]) => Array.from(new Set(items.filter(Boolean)));

const getUserIdsByRole = async (role: AppRole) => {
  const { data, error } = await supabase
    .from('user_roles')
    .select('user_id')
    .eq('role', role);

  if (error) throw error;
  return unique((data || []).map((row: any) => row.user_id as string));
};

const getProfilesByIds = async (ids: string[], columns: string) => {
  if (ids.length === 0) return [];

  const { data, error } = await supabase
    .from('profiles')
    .select(columns)
    .in('id', ids)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data || [];
};

const getAllProfiles = async (columns: string) => {
  const { data, error } = await supabase
    .from('profiles')
    .select(columns)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data || [];
};

const getVenueProviderIds = async () => {
  const { data, error } = await supabase.from('venues').select('provider_id');
  if (error) throw error;
  return unique((data || []).map((venue: any) => venue.provider_id as string));
};

const getProviderIds = async () => {
  const [roleProviderIds, venueProviderIds] = await Promise.all([
    getUserIdsByRole('provider'),
    getVenueProviderIds(),
  ]);

  return unique([...roleProviderIds, ...venueProviderIds]);
};

const attachProviderProfiles = async (venues: any[]) => {
  const providerIds = unique(venues.map((venue) => venue.provider_id as string));
  const providers = await getProfilesByIds(providerIds, 'id, name');
  const providerById = new Map(providers.map((profile: any) => [profile.id, profile]));

  return venues.map((venue) => ({
    ...venue,
    profiles: providerById.get(venue.provider_id) || null,
  }));
};

export const getAdminStats = async () => {
  const [profiles, providerIds, adminIds, bookingsRes, todayRes, revenueRes] = await Promise.all([
    getAllProfiles('id'),
    getProviderIds(),
    getUserIdsByRole('admin'),
    supabase.from('bookings').select('*', { count: 'exact', head: true }),
    supabase.from('bookings').select('*', { count: 'exact', head: true }).eq('event_date', new Date().toISOString().slice(0, 10)),
    supabase.from('bookings').select('total_price').eq('status', 'completed'),
  ]);
  if (bookingsRes.error) throw bookingsRes.error;
  if (todayRes.error) throw todayRes.error;
  if (revenueRes.error) throw revenueRes.error;

  const excludedFromUsers = new Set([...providerIds, ...adminIds]);
  const revenue = (revenueRes.data || []).reduce((s: number, b: any) => s + Number(b.total_price || 0), 0);
  return {
    userCount: profiles.filter((profile: any) => !excludedFromUsers.has(profile.id)).length,
    providerCount: providerIds.length,
    bookingCount: bookingsRes.count || 0,
    todayBookings: todayRes.count || 0,
    revenue,
  };
};

export const getAllUsers = async () => {
  const [profiles, providerIds, adminIds] = await Promise.all([
    getAllProfiles('id, name, created_at'),
    getProviderIds(),
    getUserIdsByRole('admin'),
  ]);
  const excludedFromUsers = new Set([...providerIds, ...adminIds]);
  return profiles.filter((profile: any) => !excludedFromUsers.has(profile.id));
};

export const updateUserName = async (userId: string, name: string) => {
  const { data, error } = await supabase.from('profiles').update({ name }).eq('id', userId).select('id');
  if (error) throw error;
  if (!data || data.length === 0) {
    throw new Error('No se actualizó ninguna fila. Falta política RLS de admin (UPDATE) en profiles.');
  }
};

export const deleteUserProfile = async (userId: string) => {
  const { data, error } = await supabase.from('profiles').delete().eq('id', userId).select('id');
  if (error) throw error;
  if (!data || data.length === 0) {
    throw new Error('No se eliminó ninguna fila. Es probable que falten políticas RLS de admin en la tabla profiles.');
  }
};

export const updateHostName = async (hostId: string, name: string) => {
  const { data, error } = await supabase.from('profiles').update({ name }).eq('id', hostId).select('id');
  if (error) throw error;
  if (!data || data.length === 0) {
    throw new Error('No se actualizó ninguna fila. Falta política RLS de admin (UPDATE) en profiles.');
  }
};

export const deleteHostProfile = async (hostId: string) => {
  const { data, error } = await supabase.from('profiles').delete().eq('id', hostId).select('id');
  if (error) throw error;
  if (!data || data.length === 0) {
    throw new Error('No se eliminó ninguna fila. Falta política RLS de admin (DELETE) en profiles.');
  }
};

export const getAllHosts = async () => {
  const [providerIds, venuesRes] = await Promise.all([
    getProviderIds(),
    supabase.from('venues').select('id, provider_id'),
  ]);
  if (venuesRes.error) throw venuesRes.error;

  const venueRows = venuesRes.data || [];
  const hosts = await getProfilesByIds(providerIds, 'id, name, created_at, clabe, bank_name, account_holder');
  const spacesByProvider = venueRows.reduce((acc: Record<string, number>, venue: any) => {
    acc[venue.provider_id] = (acc[venue.provider_id] || 0) + 1;
    return acc;
  }, {});

  return hosts.map((host: any) => ({ ...host, spaces: spacesByProvider[host.id] || 0 }));
};

export const getAllBookings = async () => {
  const { data, error } = await supabase
    .from('bookings')
    .select('id, event_date, status, total_price, venues(name), profiles(name)')
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
    .select('id, provider_id, name, status, city, category, created_at')
    .order('created_at', { ascending: false });
  if (error) throw error;
  return attachProviderProfiles(data || []);
};

export const getPendingVenues = async () => {
  const { data, error } = await supabase
    .from('venues')
    .select('*')
    .eq('status', 'pending');

  if (error) throw error;
  return attachProviderProfiles(data || []);
};

export const approveVenue = async (venueId: string) => {
  const { data: venue, error } = await supabase
    .from('venues')
    .update({ status: 'approved' })
    .eq('id', venueId)
    .select('name, provider_id')
    .maybeSingle();

  if (error) throw error;
  if (!venue) {
    throw new Error('No se pudo aprobar (0 filas). Falta política RLS de admin (UPDATE) en venues.');
  }

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
  if (!venue) {
    throw new Error('No se pudo rechazar (0 filas). Falta política RLS de admin (UPDATE) en venues.');
  }

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

// Tasas configurables (porcentaje)
export const COMMISSION_RATES = {
  platform: 0.10,  // 10% comisión Lugare
  gateway: 0.035,  // 3.5% comisión pasarela (Stripe estándar)
};

export const getFinanceData = async () => {
  const { data, error } = await supabase
    .from('bookings')
    .select('id, event_date, status, total_price, venues(name, category)')
    .eq('status', 'completed')
    .order('event_date', { ascending: false });
  if (error) throw error;
  return data || [];
};

// ===== Reseñas =====
export const getAllReviews = async () => {
  const { data, error } = await supabase
    .from('reviews')
    .select('id, rating, comment, created_at, venue_id, user_id, venues(name), profiles(name)')
    .order('created_at', { ascending: false })
    .limit(200);
  if (error) throw error;
  return data || [];
};

export const updateReview = async (
  reviewId: string,
  patch: { rating?: number; comment?: string }
) => {
  const { error } = await supabase.from('reviews').update(patch).eq('id', reviewId);
  if (error) throw error;
};

export const deleteReview = async (reviewId: string) => {
  const { error } = await supabase.from('reviews').delete().eq('id', reviewId);
  if (error) throw error;
};
