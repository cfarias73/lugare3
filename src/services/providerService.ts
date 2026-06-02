import { supabase } from '../../lib/supabaseClient';

export interface VenuePayload {
  name: string;
  description: string;
  category: string;
  location: string; // dirección
  city: string;
  capacity: number;
  size_sqm: number;
  price_per_hour: number;
  min_hours?: number;
  extra_hour_price?: number;
  lat?: number | null;
  lng?: number | null;
  rules?: string[];
}

export interface CreateVenueData extends VenuePayload {
  imageFiles: File[];
}

const uploadImages = async (providerId: string, venueId: string, files: File[]): Promise<string[]> => {
  const urls: string[] = [];
  for (const file of files) {
    const ext = file.name.split('.').pop() || 'jpg';
    const path = `${providerId}/${venueId}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
    const { error } = await supabase.storage.from('venues').upload(path, file, {
      contentType: file.type,
      upsert: false,
    });
    if (error) throw error;
    const { data } = supabase.storage.from('venues').getPublicUrl(path);
    urls.push(data.publicUrl);
  }
  return urls;
};

export const createVenue = async (providerId: string, data: CreateVenueData) => {
  const { imageFiles, ...payload } = data;

  const { data: venue, error: venueError } = await supabase
    .from('venues')
    .insert({
      provider_id: providerId,
      ...payload,
      status: 'pending',
    })
    .select()
    .single();

  if (venueError) throw venueError;

  if (imageFiles.length > 0) {
    const urls = await uploadImages(providerId, venue.id, imageFiles);
    const rows = urls.map((url) => ({ venue_id: venue.id, image_url: url }));
    const { error: imgErr } = await supabase.from('venue_images').insert(rows);
    if (imgErr) throw imgErr;
  }

  return venue;
};

export const updateVenue = async (
  providerId: string,
  venueId: string,
  data: Partial<VenuePayload> & { imageFiles?: File[] }
) => {
  const { imageFiles, ...payload } = data;

  const { error } = await supabase
    .from('venues')
    .update(payload)
    .eq('id', venueId)
    .eq('provider_id', providerId);
  if (error) throw error;

  if (imageFiles && imageFiles.length > 0) {
    const urls = await uploadImages(providerId, venueId, imageFiles);
    const rows = urls.map((url) => ({ venue_id: venueId, image_url: url }));
    const { error: imgErr } = await supabase.from('venue_images').insert(rows);
    if (imgErr) throw imgErr;
  }
};

export const getVenueForEdit = async (providerId: string, venueId: string) => {
  const { data, error } = await supabase
    .from('venues')
    .select('*, venue_images (image_url)')
    .eq('id', venueId)
    .eq('provider_id', providerId)
    .maybeSingle();
  if (error) throw error;
  return data;
};

export const updateVenueStatus = async (
  providerId: string,
  venueId: string,
  status: 'approved' | 'paused' | 'pending'
) => {
  const { error } = await supabase
    .from('venues')
    .update({ status })
    .eq('id', venueId)
    .eq('provider_id', providerId);
  if (error) throw error;
};

export const deleteVenue = async (providerId: string, venueId: string) => {
  const { error } = await supabase
    .from('venues')
    .delete()
    .eq('id', venueId)
    .eq('provider_id', providerId);
  if (error) throw error;
};

export const getProviderVenues = async (providerId: string) => {
  const { data, error } = await supabase
    .from('venues')
    .select(`
      *,
      venue_images (
        image_url
      )
    `)
    .eq('provider_id', providerId)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data;
};

export type BookingStatus = 'pending' | 'confirmed' | 'cancelled' | 'completed';

export const getProviderBookings = async (providerId: string, status?: BookingStatus) => {
  let q = supabase
    .from('bookings')
    .select(`
      *,
      venues!inner (
        id,
        provider_id,
        name
      ),
      profiles (
        name,
        phone,
        avatar_url
      )
    `)
    .eq('venues.provider_id', providerId)
    .order('created_at', { ascending: false });

  if (status) q = q.eq('status', status);

  const { data, error } = await q;
  if (error) throw error;
  return data || [];
};

export const updateBookingStatus = async (
  providerId: string,
  bookingId: string,
  status: BookingStatus
) => {
  // Verify ownership via venue
  const { data: booking, error: fetchErr } = await supabase
    .from('bookings')
    .select('id, user_id, venue_id, event_date, venues!inner(provider_id, name)')
    .eq('id', bookingId)
    .single();
  if (fetchErr) throw fetchErr;
  // @ts-ignore
  if (booking.venues.provider_id !== providerId) throw new Error('No autorizado');

  const { error } = await supabase
    .from('bookings')
    .update({ status })
    .eq('id', bookingId);
  if (error) throw error;
  return booking;
};

export type DashboardPeriod = 'hoy' | 'esta_semana' | 'este_mes';

const startOfDay = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate());
const fmtDate = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

const getPeriodRange = (period: DashboardPeriod): { from: Date; to: Date; prevFrom: Date; prevTo: Date } => {
  const now = new Date();
  if (period === 'hoy') {
    const from = startOfDay(now);
    const to = new Date(from); to.setDate(to.getDate() + 1);
    const prevFrom = new Date(from); prevFrom.setDate(prevFrom.getDate() - 1);
    const prevTo = new Date(from);
    return { from, to, prevFrom, prevTo };
  }
  if (period === 'esta_semana') {
    const day = now.getDay() === 0 ? 6 : now.getDay() - 1; // Mon=0
    const from = startOfDay(now); from.setDate(from.getDate() - day);
    const to = new Date(from); to.setDate(to.getDate() + 7);
    const prevFrom = new Date(from); prevFrom.setDate(prevFrom.getDate() - 7);
    const prevTo = new Date(from);
    return { from, to, prevFrom, prevTo };
  }
  // este_mes
  const from = new Date(now.getFullYear(), now.getMonth(), 1);
  const to = new Date(now.getFullYear(), now.getMonth() + 1, 1);
  const prevFrom = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const prevTo = new Date(from);
  return { from, to, prevFrom, prevTo };
};

const buildBuckets = (period: DashboardPeriod, bookings: any[]): { chartData: number[]; chartLabels: string[] } => {
  if (period === 'hoy') {
    const labels = ['00-04', '04-08', '08-12', '12-16', '16-20', '20-24'];
    const buckets = [0, 0, 0, 0, 0, 0];
    bookings.forEach(b => {
      const hour = parseInt((b.start_time || '00:00').slice(0, 2), 10);
      buckets[Math.min(5, Math.floor(hour / 4))] += Number(b.total_price) || 0;
    });
    return { chartData: buckets, chartLabels: labels };
  }
  if (period === 'esta_semana') {
    const labels = ['LUN', 'MAR', 'MIE', 'JUE', 'VIE', 'SAB', 'DOM'];
    const buckets = [0, 0, 0, 0, 0, 0, 0];
    bookings.forEach(b => {
      const d = new Date(b.event_date + 'T00:00:00');
      const day = d.getDay() === 0 ? 6 : d.getDay() - 1;
      buckets[day] += Number(b.total_price) || 0;
    });
    return { chartData: buckets, chartLabels: labels };
  }
  // este_mes: 6 last months including current
  const now = new Date();
  const labels: string[] = [];
  const keys: string[] = [];
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    labels.push(d.toLocaleDateString('es-MX', { month: 'short' }).toUpperCase().replace('.', ''));
    keys.push(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`);
  }
  const buckets = keys.map(() => 0);
  bookings.forEach(b => {
    const key = (b.event_date || '').slice(0, 7);
    const idx = keys.indexOf(key);
    if (idx >= 0) buckets[idx] += Number(b.total_price) || 0;
  });
  return { chartData: buckets, chartLabels: labels };
};

export const getProviderDashboard = async (providerId: string, period: DashboardPeriod) => {
  const { from, to, prevFrom, prevTo } = getPeriodRange(period);

  // For chart on "este_mes" we need a wider window (6 months back)
  const chartFrom = period === 'este_mes'
    ? new Date(from.getFullYear(), from.getMonth() - 5, 1)
    : from;

  const { data, error } = await supabase
    .from('bookings')
    .select('id, event_date, start_time, end_time, total_price, status, guest_count, created_at, user_id, venues!inner(id, name, provider_id), profiles(name, avatar_url)')
    .eq('venues.provider_id', providerId)
    .gte('event_date', fmtDate(chartFrom))
    .lt('event_date', fmtDate(period === 'este_mes' ? to : to))
    .order('event_date', { ascending: true });

  if (error) throw error;
  const all = data || [];

  // Current period (status confirmed counts for revenue; reservations include pending+confirmed)
  const inCurrent = all.filter(b => b.event_date >= fmtDate(from) && b.event_date < fmtDate(to));
  const confirmedCurrent = inCurrent.filter(b => b.status === 'confirmed');
  const reservas = inCurrent.length;
  const ingresos = confirmedCurrent.reduce((s, b) => s + (Number(b.total_price) || 0), 0);

  // Previous period for trends — needs separate query because chartFrom may already cover it for monthly
  const { data: prevData } = await supabase
    .from('bookings')
    .select('id, total_price, status, venues!inner(provider_id)')
    .eq('venues.provider_id', providerId)
    .gte('event_date', fmtDate(prevFrom))
    .lt('event_date', fmtDate(prevTo));
  const prevAll = prevData || [];
  const prevReservas = prevAll.length;
  const prevIngresos = prevAll.filter(b => b.status === 'confirmed').reduce((s, b) => s + (Number(b.total_price) || 0), 0);

  const pct = (curr: number, prev: number): string => {
    if (prev === 0) return curr > 0 ? '+100%' : '0%';
    const d = ((curr - prev) / prev) * 100;
    return `${d >= 0 ? '+' : ''}${Math.round(d)}%`;
  };

  // Chart uses confirmed bookings within chart window
  const chartBookings = all.filter(b => b.status === 'confirmed');
  const { chartData, chartLabels } = buildBuckets(period, chartBookings);

  // Upcoming bookings: next confirmed events from today
  const today = fmtDate(startOfDay(new Date()));
  const upcoming = all
    .filter(b => b.status === 'confirmed' && b.event_date >= today)
    .slice(0, 3);

  return {
    reservas,
    reservasTrend: pct(reservas, prevReservas),
    ingresos,
    ingresosTrend: pct(ingresos, prevIngresos),
    chartData,
    chartLabels,
    upcoming,
  };
};
