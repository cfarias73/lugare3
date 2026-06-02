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
