import { supabase } from '../../lib/supabaseClient';
import { createNotification } from './notificationService';

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
