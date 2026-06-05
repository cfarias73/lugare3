import { supabase } from '../../lib/supabaseClient';

const toDateStr = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

const monthRange = (year: number, month: number) => {
  const start = new Date(year, month, 1);
  const end = new Date(year, month + 1, 0); // last day of month
  return { start: toDateStr(start), end: toDateStr(end) };
};

/** Returns Set of 'YYYY-MM-DD' strings for blocked dates of the venue in the given month. */
export const getBlockedDatesForMonth = async (
  venueId: string,
  year: number,
  month: number // 0-indexed
): Promise<Set<string>> => {
  const { start, end } = monthRange(year, month);
  const { data, error } = await supabase
    .from('venue_blocked_dates')
    .select('blocked_date')
    .eq('venue_id', venueId)
    .gte('blocked_date', start)
    .lte('blocked_date', end);
  if (error) {
    console.warn('Error fetching blocked dates', error);
    return new Set();
  }
  return new Set((data || []).map((r: any) => r.blocked_date));
};

export const blockDate = async (venueId: string, dateStr: string) => {
  const { error } = await supabase
    .from('venue_blocked_dates')
    .insert({ venue_id: venueId, blocked_date: dateStr });
  if (error) throw error;
};

export const unblockDate = async (venueId: string, dateStr: string) => {
  const { error } = await supabase
    .from('venue_blocked_dates')
    .delete()
    .eq('venue_id', venueId)
    .eq('blocked_date', dateStr);
  if (error) throw error;
};

/** Inserta muchos días bloqueados de una sola vez (ignora duplicados). */
export const bulkBlockDates = async (venueId: string, dates: string[]) => {
  if (dates.length === 0) return { inserted: 0 };
  const unique = Array.from(new Set(dates));
  const rows = unique.map((d) => ({ venue_id: venueId, blocked_date: d }));
  // Si la tabla tiene unique(venue_id, blocked_date) los duplicados se ignoran.
  const { error } = await supabase
    .from('venue_blocked_dates')
    .upsert(rows, { onConflict: 'venue_id,blocked_date', ignoreDuplicates: true });
  if (error) throw error;
  return { inserted: unique.length };
};

/** Devuelve fechas con reservas confirmadas/completadas en un rango arbitrario. */
export const getBookedDatesInRange = async (
  venueId: string,
  startStr: string,
  endStr: string
): Promise<Set<string>> => {
  const { data, error } = await supabase
    .from('bookings')
    .select('event_date, status')
    .eq('venue_id', venueId)
    .in('status', ['confirmed', 'completed'])
    .gte('event_date', startStr)
    .lte('event_date', endStr);
  if (error) {
    console.warn('Error fetching booked dates range', error);
    return new Set();
  }
  return new Set((data || []).map((r: any) => r.event_date));
};

/** Genera todas las fechas YYYY-MM-DD entre dos fechas inclusive. */
export const enumerateDates = (startStr: string, endStr: string): string[] => {
  const out: string[] = [];
  const [sy, sm, sd] = startStr.split('-').map(Number);
  const [ey, em, ed] = endStr.split('-').map(Number);
  const cur = new Date(sy, sm - 1, sd);
  const end = new Date(ey, em - 1, ed);
  while (cur <= end) {
    out.push(toDateStr(cur));
    cur.setDate(cur.getDate() + 1);
  }
  return out;
};

/** Genera fechas dentro de un rango que caigan en los weekdays dados (0=Domingo..6=Sábado). */
export const enumerateRecurringDates = (
  startStr: string,
  endStr: string,
  weekdays: number[]
): string[] => {
  const set = new Set(weekdays);
  return enumerateDates(startStr, endStr).filter((d) => {
    const [y, m, day] = d.split('-').map(Number);
    return set.has(new Date(y, m - 1, day).getDay());
  });
};

/** Returns Set of venue_ids that are blocked on the given date. */
export const getVenuesBlockedOnDate = async (dateStr: string): Promise<Set<string>> => {
  const { data, error } = await supabase
    .from('venue_blocked_dates')
    .select('venue_id')
    .eq('blocked_date', dateStr);
  if (error) {
    console.warn('Error fetching venues blocked on date', error);
    return new Set();
  }
  return new Set((data || []).map((r: any) => r.venue_id));
};

/** Returns Set of 'YYYY-MM-DD' strings for confirmed bookings of the venue in the given month. */
export const getBookedDatesForMonth = async (
  venueId: string,
  year: number,
  month: number
): Promise<Set<string>> => {
  const { start, end } = monthRange(year, month);
  const { data, error } = await supabase
    .from('bookings')
    .select('event_date, status')
    .eq('venue_id', venueId)
    .in('status', ['confirmed', 'completed'])
    .gte('event_date', start)
    .lte('event_date', end);
  if (error) {
    console.warn('Error fetching booked dates', error);
    return new Set();
  }
  return new Set((data || []).map((r: any) => r.event_date));
};
