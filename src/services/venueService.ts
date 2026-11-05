import { supabase } from '../../lib/supabaseClient';
import { Venue } from '../../types';

const FALLBACK_IMAGE = 'https://images.unsplash.com/photo-1519167758481-83f5e181dcc3?auto=format&fit=crop&q=80&w=800';

const mapVenue = (v: any): Venue => {
  const images: string[] = Array.isArray(v.venue_images) && v.venue_images.length > 0
    ? v.venue_images.map((img: any) => (typeof img === 'string' ? img : img?.image_url)).filter(Boolean)
    : [FALLBACK_IMAGE];

  return {
    id: v.id,
    providerId: v.provider_id,
    status: v.status || 'pending',
    name: v.name,
    location: v.location,
    city: v.city,
    price: Number(v.price_per_hour) || 0,
    rating: v.rating || 0,
    reviewsCount: v.reviews_count || 0,
    image: images[0] || FALLBACK_IMAGE,
    images: images.length > 0 ? images : [FALLBACK_IMAGE],
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
  basePrice: v.base_price != null ? Number(v.base_price) : undefined,
  baseCapacity: v.base_capacity != null ? Number(v.base_capacity) : undefined,
  maxCapacity: v.max_capacity != null ? Number(v.max_capacity) : undefined,
  includedHours: v.included_hours != null ? Number(v.included_hours) : undefined,
  extraPersonPrice: v.extra_person_price != null ? Number(v.extra_person_price) : 0,
  amenities: Array.isArray(v.amenities) ? v.amenities.filter((x: any) => typeof x === 'string') : [],
  cancellationType: v.cancellation_type ?? 'non_refundable',
  cancellationDays: v.cancellation_days != null ? Number(v.cancellation_days) : undefined,
  cancellationTiers: Array.isArray(v.cancellation_tiers) ? v.cancellation_tiers : [],
  maxExtraHours: v.max_extra_hours != null ? Number(v.max_extra_hours) : 6,
  };
};

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

export interface PublicVenueService {
  id: string;
  name: string;
  description: string | null;
  price: number;
}

export const getVenueServices = async (venueId: string): Promise<PublicVenueService[]> => {
  const { data, error } = await supabase
    .from('venue_services')
    .select('id, name, description, price')
    .eq('venue_id', venueId)
    .order('created_at', { ascending: true });
  if (error) {
    console.warn('Error fetching venue services', error);
    return [];
  }
  return (data || []).map((s: any) => ({
    id: s.id,
    name: s.name,
    description: s.description,
    price: Number(s.price) || 0,
  }));
};

export const getServicesByIds = async (ids: string[]): Promise<PublicVenueService[]> => {
  if (ids.length === 0) return [];
  const { data, error } = await supabase
    .from('venue_services')
    .select('id, name, description, price')
    .in('id', ids);
  if (error) {
    console.warn('Error fetching services by ids', error);
    return [];
  }
  return (data || []).map((s: any) => ({
    id: s.id,
    name: s.name,
    description: s.description,
    price: Number(s.price) || 0,
  }));
};

