import { supabase } from '../../lib/supabaseClient';

export const getAdminStats = async () => {
  const { data: users, count: userCount } = await supabase
    .from('profiles')
    .select('*', { count: 'exact', head: true });

  const { data: venues, count: venueCount } = await supabase
    .from('venues')
    .select('*', { count: 'exact', head: true });

  const { data: bookings, count: bookingCount } = await supabase
    .from('bookings')
    .select('*', { count: 'exact', head: true });

  return { userCount, venueCount, bookingCount };
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
  const { error } = await supabase
    .from('venues')
    .update({ status: 'approved' })
    .eq('id', venueId);

  if (error) throw error;
};
