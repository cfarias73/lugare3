import { supabase } from '../../lib/supabaseClient';
import { Venue } from '../../types';

const FALLBACK_IMAGE = 'https://images.unsplash.com/photo-1519167758481-83f5e181dcc3?auto=format&fit=crop&q=80&w=800';

const mapVenue = (v: any): Venue => ({
  id: v.id,
  name: v.name,
  location: v.location,
  city: v.city,
  price: Number(v.price_per_hour) || 0,
  rating: v.rating || 0,
  reviewsCount: v.reviews_count || 0,
  image: v.venue_images && v.venue_images.length > 0
    ? v.venue_images[0].image_url
    : FALLBACK_IMAGE,
  capacity: v.capacity,
  size: v.size_sqm,
  lat: v.lat || 19.4326,
  lng: v.lng || -99.1332,
  isFeatured: v.is_featured,
  isNew: v.is_new,
  discount: v.discount_badge,
  category: v.category,
  minHours: Number(v.min_hours) > 0 ? Number(v.min_hours) : 4,
  extraHourPrice: v.extra_hour_price != null ? Number(v.extra_hour_price) : Number(v.price_per_hour) || 0,
});

export const getVenues = async (): Promise<Venue[]> => {
  const { data, error } = await supabase
    .from('venues')
    .select(`*, venue_images (image_url)`)
    .eq('status', 'approved');

  if (error) {
    console.error('Error fetching venues:', error);
    return [];
  }
  return (data || []).map(mapVenue);
};

export const getVenueById = async (id: string): Promise<Venue | null> => {
  const { data, error } = await supabase
    .from('venues')
    .select(`*, venue_images (image_url)`)
    .eq('id', id)
    .maybeSingle();

  if (error || !data) {
    if (error) console.error('Error fetching venue:', error);
    return null;
  }
  return mapVenue(data);
};

export const getVenuesByIds = async (ids: string[]): Promise<Venue[]> => {
  if (ids.length === 0) return [];
  const { data, error } = await supabase
    .from('venues')
    .select(`*, venue_images (image_url)`)
    .in('id', ids);

  if (error) {
    console.error('Error fetching venues by ids:', error);
    return [];
  }
  return (data || []).map(mapVenue);
};
