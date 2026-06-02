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
    .select('*, venue_images (id, image_url)')
    .eq('id', venueId)
    .eq('provider_id', providerId)
    .maybeSingle();
  if (error) throw error;
  return data;
};

export const deleteVenueImages = async (
  providerId: string,
  venueId: string,
  imageIds: string[]
) => {
  if (imageIds.length === 0) return;
  // Verificar ownership del venue
  const { data: venue, error: vErr } = await supabase
    .from('venues')
    .select('id')
    .eq('id', venueId)
    .eq('provider_id', providerId)
    .maybeSingle();
  if (vErr) throw vErr;
  if (!venue) throw new Error('No autorizado');

  const { error } = await supabase
    .from('venue_images')
    .delete()
    .in('id', imageIds)
    .eq('venue_id', venueId);
  if (error) throw error;
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
  status: BookingStatus,
  rejectionReason?: string
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

  const patch: Record<string, unknown> = { status };
  if (status === 'cancelled' && rejectionReason) patch.rejection_reason = rejectionReason;

  const { error } = await supabase
    .from('bookings')
    .update(patch)
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

// ============= STATS =============
export interface ProviderStats {
  totalReservas: number;
  totalReservasTrend: string;
  completadas: number;
  completadasTrend: string;
  ingresos: number;
  ingresosTrend: string;
  visitas: number; // best-effort
  visitasTrend: string;
  trend: { name: string; value: number }[];
  topVenues: { rank: number; name: string; count: number; trend: string }[];
  monthLabel: string;
  prevMonthLabel: string;
}

const monthName = (d: Date) =>
  d.toLocaleDateString('es-MX', { month: 'long', year: 'numeric' }).replace(/^./, c => c.toUpperCase());

export const getProviderStats = async (
  providerId: string,
  refDate: Date
): Promise<ProviderStats> => {
  const from = new Date(refDate.getFullYear(), refDate.getMonth(), 1);
  const to = new Date(refDate.getFullYear(), refDate.getMonth() + 1, 1);
  const prevFrom = new Date(refDate.getFullYear(), refDate.getMonth() - 1, 1);

  // Wide window: 6 months back through current month for the trend chart
  const chartFrom = new Date(refDate.getFullYear(), refDate.getMonth() - 5, 1);

  const { data, error } = await supabase
    .from('bookings')
    .select('id, event_date, total_price, status, venues!inner(id, name, provider_id)')
    .eq('venues.provider_id', providerId)
    .gte('event_date', fmtDate(chartFrom))
    .lt('event_date', fmtDate(to));
  if (error) throw error;
  const all = data || [];

  const inRange = (b: any, a: Date, z: Date) =>
    b.event_date >= fmtDate(a) && b.event_date < fmtDate(z);

  const curr = all.filter(b => inRange(b, from, to));
  const prev = all.filter(b => inRange(b, prevFrom, from));

  const totalReservas = curr.length;
  const prevReservas = prev.length;
  const completadas = curr.filter(b => b.status === 'completed' || b.status === 'confirmed').length;
  const prevCompletadas = prev.filter(b => b.status === 'completed' || b.status === 'confirmed').length;
  const ingresos = curr.filter(b => b.status === 'confirmed' || b.status === 'completed').reduce((s, b) => s + (Number(b.total_price) || 0), 0);
  const prevIngresos = prev.filter(b => b.status === 'confirmed' || b.status === 'completed').reduce((s, b) => s + (Number(b.total_price) || 0), 0);

  const pct = (c: number, p: number): string => {
    if (p === 0) return c > 0 ? '+100%' : '0%';
    const d = ((c - p) / p) * 100;
    return `${d >= 0 ? '+' : ''}${Math.round(d)}%`;
  };

  // Trend: last 6 months count of bookings
  const trend: { name: string; value: number }[] = [];
  for (let i = 5; i >= 0; i--) {
    const d = new Date(refDate.getFullYear(), refDate.getMonth() - i, 1);
    const next = new Date(d.getFullYear(), d.getMonth() + 1, 1);
    const label = d.toLocaleDateString('es-MX', { month: 'short' }).replace('.', '');
    trend.push({
      name: label.charAt(0).toUpperCase() + label.slice(1, 3),
      value: all.filter(b => inRange(b, d, next)).length,
    });
  }

  // Top venues this month
  const venueCounts = new Map<string, { name: string; count: number; prev: number }>();
  curr.forEach((b: any) => {
    const v = venueCounts.get(b.venues.id) || { name: b.venues.name, count: 0, prev: 0 };
    v.count += 1;
    venueCounts.set(b.venues.id, v);
  });
  prev.forEach((b: any) => {
    const v = venueCounts.get(b.venues.id) || { name: b.venues.name, count: 0, prev: 0 };
    v.prev += 1;
    venueCounts.set(b.venues.id, v);
  });
  const topVenues = Array.from(venueCounts.values())
    .sort((a, b) => b.count - a.count)
    .slice(0, 3)
    .map((v, idx) => ({
      rank: idx + 1,
      name: v.name,
      count: v.count,
      trend: pct(v.count, v.prev),
    }));

  // Visits: best-effort via analytics_events if present (silent fallback)
  let visitas = 0;
  let prevVisitas = 0;
  try {
    const venueIds = Array.from(venueCounts.keys());
    const { data: venuesList } = await supabase
      .from('venues')
      .select('id')
      .eq('provider_id', providerId);
    const ids = (venuesList || []).map((v: any) => v.id);
    if (ids.length) {
      const { data: ev } = await supabase
        .from('analytics_events')
        .select('id, created_at, metadata')
        .eq('event_type', 'venue_view')
        .gte('created_at', from.toISOString())
        .lt('created_at', to.toISOString());
      visitas = (ev || []).filter((e: any) => ids.includes(e.metadata?.venue_id)).length;
      const { data: evPrev } = await supabase
        .from('analytics_events')
        .select('id, metadata')
        .eq('event_type', 'venue_view')
        .gte('created_at', prevFrom.toISOString())
        .lt('created_at', from.toISOString());
      prevVisitas = (evPrev || []).filter((e: any) => ids.includes(e.metadata?.venue_id)).length;
    }
  } catch (_) {
    // ignore
  }

  return {
    totalReservas,
    totalReservasTrend: pct(totalReservas, prevReservas),
    completadas,
    completadasTrend: pct(completadas, prevCompletadas),
    ingresos,
    ingresosTrend: pct(ingresos, prevIngresos),
    visitas,
    visitasTrend: pct(visitas, prevVisitas),
    trend,
    topVenues,
    monthLabel: monthName(from),
    prevMonthLabel: monthName(prevFrom),
  };
};

// ============= ADDITIONAL SERVICES =============
export interface VenueService {
  id: string;
  venue_id: string;
  name: string;
  description: string | null;
  price: number;
  created_at: string;
}

export const listProviderServices = async (providerId: string): Promise<(VenueService & { venue_name: string })[]> => {
  const { data: venues, error: vErr } = await supabase
    .from('venues')
    .select('id, name')
    .eq('provider_id', providerId);
  if (vErr) throw vErr;
  const venueIds = (venues || []).map(v => v.id);
  if (venueIds.length === 0) return [];

  const { data, error } = await supabase
    .from('venue_services')
    .select('*')
    .in('venue_id', venueIds)
    .order('created_at', { ascending: false });
  if (error) throw error;

  const nameMap = new Map((venues || []).map((v: any) => [v.id, v.name]));
  return (data || []).map((s: any) => ({ ...s, venue_name: nameMap.get(s.venue_id) || 'Espacio' }));
};

export const createService = async (
  venueId: string,
  payload: { name: string; description?: string | null; price: number }
): Promise<VenueService> => {
  const { data, error } = await supabase
    .from('venue_services')
    .insert({ venue_id: venueId, name: payload.name, description: payload.description ?? null, price: payload.price })
    .select('*')
    .single();
  if (error) throw error;
  return data;
};

export const updateService = async (
  id: string,
  payload: Partial<{ name: string; description: string | null; price: number; venue_id: string }>
): Promise<void> => {
  const { error } = await supabase.from('venue_services').update(payload).eq('id', id);
  if (error) throw error;
};

export const deleteService = async (id: string): Promise<void> => {
  const { error } = await supabase.from('venue_services').delete().eq('id', id);
  if (error) throw error;
};
