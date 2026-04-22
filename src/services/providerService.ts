import { supabase } from '../../lib/supabaseClient';

export interface CreateVenueData {
  name: string;
  description: string;
  category: 'salones' | 'fiestas' | 'reuniones';
  location: string;
  city: string;
  capacity: number;
  size_sqm: number;
  price_per_hour: number;
  imageFile: File;
}

export const createVenue = async (providerId: string, data: CreateVenueData) => {
  // 1. Upload the image
  const fileExt = data.imageFile.name.split('.').pop();
  const filePath = `${providerId}/${Math.random()}.${fileExt}`;
  
  const { error: uploadError } = await supabase.storage
    .from('venues')
    .upload(filePath, data.imageFile);

  if (uploadError) throw uploadError;

  const { data: imageUrlData } = supabase.storage
    .from('venues')
    .getPublicUrl(filePath);

  // 2. Insert the venue
  const { data: venue, error: venueError } = await supabase
    .from('venues')
    .insert({
      provider_id: providerId,
      name: data.name,
      description: data.description,
      category: data.category,
      location: data.location,
      city: data.city,
      capacity: data.capacity,
      size_sqm: data.size_sqm,
      price_per_hour: data.price_per_hour,
      status: 'pending' // Defaults to pending for admin approval
    })
    .select()
    .single();

  if (venueError) throw venueError;

  // 3. Insert the image
  const { error: imageError } = await supabase
    .from('venue_images')
    .insert({
      venue_id: venue.id,
      image_url: imageUrlData.publicUrl
    });

  if (imageError) throw imageError;

  return venue;
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
    .eq('provider_id', providerId);

  if (error) throw error;
  return data;
};

export const getProviderBookings = async (providerId: string) => {
  const { data, error } = await supabase
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
        email
      )
    `)
    .eq('venues.provider_id', providerId);

  if (error) throw error;
  return data;
};
