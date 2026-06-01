
export interface Venue {
  id: string;
  name: string;
  location: string;
  city: string;
  price: number;
  rating: number;
  reviewsCount: number;
  image: string;
  capacity: number;
  size: number;
  lat: number;
  lng: number;
  isFeatured?: boolean;
  isNew?: boolean;
  discount?: string;
  category: 'salones' | 'fiestas' | 'reuniones';
  minHours?: number;
  extraHourPrice?: number;
}

export interface Review {
  id: string;
  userName: string;
  date: string;
  rating: number;
  comment: string;
  avatar: string;
}

export interface Message {
  id: string;
  sender: string;
  avatar: string;
  content: string;
  time: string;
  venueName: string;
  unreadCount?: number;
  isOnline?: boolean;
}

export interface Booking {
  id: string;
  venueName: string;
  location: string;
  image: string;
  date: string;
  time: string;
  totalPrice: number;
  status: 'Confirmada' | 'Pendiente' | 'Cancelada';
  statusColor: string;
}

export interface Guest {
  id: string;
  name: string;
  email: string;
}

export interface User {
  id: string;
  name: string;
  email: string;
  isAuthenticated: boolean;
  role: 'user' | 'provider' | 'admin';
}

export interface Invitation {
  id: string;
  designId: string;
  eventName: string;
  date: string;
  time: string;
  location: string;
  guests: Guest[];
}
