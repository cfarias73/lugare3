import { supabase } from '../../lib/supabaseClient';
import { Venue } from '../../types';

export const getVenues = async (): Promise<Venue[]> => {
  const { data, error } = await supabase
    .from('venues')
    .select(`
      *,
      venue_images (
        image_url
      )
    `)
    .eq('status', 'approved');

  if (error) {
    console.error('Error fetching venues:', error);
    return [];
  }

  return data.map((v: any) => ({
    id: v.id,
    name: v.name,
    location: v.location,
    city: v.city,
    price: v.price_per_hour,
    rating: v.rating || 0.0,
    reviewsCount: v.reviews_count || 0,
    // Provide a fallback placeholder image if the venue doesn't have images
    image: v.venue_images && v.venue_images.length > 0 
           ? v.venue_images[0].image_url 
           : 'https://images.unsplash.com/photo-1519167758481-83f5e181dcc3?auto=format&fit=crop&q=80&w=800',
    capacity: v.capacity,
    size: v.size_sqm,
    lat: v.lat || 19.4326, // Fallback coordinates if null
    lng: v.lng || -99.1332,
    isFeatured: v.is_featured,
    isNew: v.is_new,
    discount: v.discount_badge,
    category: v.category,
  }));
};
