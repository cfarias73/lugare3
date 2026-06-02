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
        email,
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
