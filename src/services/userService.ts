import { supabase } from '../../lib/supabaseClient';
import { createNotification } from './notificationService';

export interface BookingData {
  user_id: string;
  venue_id: string;
  event_date: string;
  start_time: string;
  end_time: string;
  guest_count: number;
  total_price: number;
}

export const checkAvailability = async (venueId: string, eventDate: string, startTime: string, endTime: string): Promise<boolean> => {
  const { data, error } = await supabase
    .from('bookings')
    .select('id')
    .eq('venue_id', venueId)
    .eq('event_date', eventDate)
    .lt('start_time', endTime)
    .gt('end_time', startTime);

  if (error) throw error;
  return data.length === 0;
};

export const createBooking = async (data: BookingData) => {
  const isAvailable = await checkAvailability(data.venue_id, data.event_date, data.start_time, data.end_time);
  if (!isAvailable) throw new Error('El lugar ya está reservado en este horario');

  const { data: booking, error } = await supabase
    .from('bookings')
    .insert({
      ...data,
      status: 'pending'
    })
    .select()
    .single();

  if (error) throw error;

  // Notificar al anfitrión
  try {
    const { data: venue } = await supabase
      .from('venues')
      .select('name, provider_id')
      .eq('id', data.venue_id)
      .maybeSingle();
    if (venue?.provider_id) {
      await createNotification({
        userId: venue.provider_id,
        title: 'Nueva reserva recibida',
        message: `Tienes una solicitud para ${venue.name} el ${data.event_date}.`,
        type: 'info',
        link: '/provider/received-bookings',
      });
    }
  } catch (e) {
    console.error('notify provider failed', e);
  }

  return booking;
};

export const addReview = async (venueId: string, userId: string, rating: number, comment: string) => {
  const { data, error } = await supabase
    .from('reviews')
    .insert({
      venue_id: venueId,
      user_id: userId,
      rating: rating,
      comment: comment
    })
    .select()
    .single();

  if (error) throw error;
  return data;
};

export const getUserBookings = async (userId: string) => {
  const { data, error } = await supabase
    .from('bookings')
    .select(`
      *,
      venues (
        name,
        location,
        venue_images (image_url)
      )
    `)
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data;
};
