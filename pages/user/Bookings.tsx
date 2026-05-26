
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../../components/Layout';
import { useUser } from '../../context/UserContext';
import { Skeleton } from '../../components/ui/Skeleton';
import { EmptyState } from '../../components/ui/EmptyState';
import { motion, AnimatePresence } from 'motion/react';
import { getUserBookings } from '../../src/services/userService';

const FALLBACK_IMAGE = 'https://images.unsplash.com/photo-1519167758481-83f5e181dcc3?auto=format&fit=crop&q=80&w=800';

interface UIBooking {
  id: string;
  venueId: string;
  venueName: string;
  location: string;
  image: string;
  date: string;
  time: string;
  totalPrice: number;
  status: string;
  statusColor: string;
  eventDate: string; // ISO yyyy-mm-dd
}

const STATUS_COLORS: Record<string, string> = {
  confirmed: '#00B4BB',
  pending: '#F6A623',
  cancelled: '#E5484D',
  completed: '#5EB962',
};

const STATUS_LABELS: Record<string, string> = {
  confirmed: 'Confirmada',
  pending: 'Pendiente',
  cancelled: 'Cancelada',
  completed: 'Completada',
};

const formatDate = (iso: string) => {
  try {
    return new Date(iso).toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' });
  } catch { return iso; }
};

const formatTime = (start: string, end: string) => `${start?.slice(0,5) || ''} - ${end?.slice(0,5) || ''}`;

const mapBooking = (b: any): UIBooking => ({
  id: b.id,
  venueId: b.venue_id,
  venueName: b.venues?.name || 'Espacio',
  location: b.venues?.location || '',
  image: b.venues?.venue_images?.[0]?.image_url || FALLBACK_IMAGE,
  date: formatDate(b.event_date),
  time: formatTime(b.start_time, b.end_time),
  totalPrice: Number(b.total_price) || 0,
  status: STATUS_LABELS[b.status] || b.status,
  statusColor: STATUS_COLORS[b.status] || '#00B4BB',
  eventDate: b.event_date,
});

const BookingDetailModal: React.FC<{ booking: UIBooking; onClose: () => void }> = ({ booking, onClose }) => (
  <AnimatePresence>
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
      onClick={onClose}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }}
        className="bg-white dark:bg-surface-dark rounded-[32px] p-6 shadow-2xl w-full max-w-md"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="text-xl font-bold mb-4 dark:text-white">Detalles de la Reserva</h2>
        <div className="space-y-2 text-sm dark:text-slate-300">
          <p><strong>Lugar:</strong> {booking.venueName}</p>
          <p><strong>Fecha:</strong> {booking.date}</p>
          <p><strong>Horario:</strong> {booking.time}</p>
          <p><strong>Ubicación:</strong> {booking.location}</p>
          <p><strong>Total:</strong> ${booking.totalPrice.toLocaleString()}</p>
          <p><strong>Estado:</strong> {booking.status}</p>
        </div>
        <button onClick={onClose} className="mt-6 w-full py-3 bg-primary text-white rounded-xl font-bold">Cerrar</button>
      </motion.div>
    </motion.div>
  </AnimatePresence>
);

const Bookings: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useUser();
  const [loading, setLoading] = useState(true);
  const [bookings, setBookings] = useState<UIBooking[]>([]);
  const [tab, setTab] = useState<'upcoming' | 'past'>('upcoming');
  const [selectedBooking, setSelectedBooking] = useState<UIBooking | null>(null);
  const [query, setQuery] = useState('');

  useEffect(() => {
    if (!user) { setLoading(false); return; }
    setLoading(true);
    getUserBookings(user.id)
      .then((data) => setBookings((data || []).map(mapBooking)))
      .catch((e) => console.error(e))
      .finally(() => setLoading(false));
  }, [user]);

  const today = new Date().toISOString().slice(0, 10);
  const tabFiltered = bookings.filter((b) => tab === 'upcoming' ? b.eventDate >= today : b.eventDate < today);
  const filteredBookings = tabFiltered.filter((b) => {
    const q = query.trim().toLowerCase();
    if (!q) return true;
    return (
      b.venueName?.toLowerCase().includes(q) ||
      b.date?.toLowerCase().includes(q) ||
      b.location?.toLowerCase().includes(q)
    );
  });

  return (
    <Layout>
      {selectedBooking && <BookingDetailModal booking={selectedBooking} onClose={() => setSelectedBooking(null)} />}
      <header className="sticky top-0 z-50 bg-white dark:bg-background-dark border-b border-slate-100 dark:border-slate-800 px-4 pt-4">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-xl font-bold text-slate-800 dark:text-white">Historial de Reservas</h1>
          <span className="material-icons-outlined text-primary cursor-pointer">filter_alt</span>
        </div>
        <div className="flex w-full">
          <button
            onClick={() => setTab('upcoming')}
            className={`flex-1 pb-3 text-center border-b-2 font-semibold ${tab === 'upcoming' ? 'border-primary text-primary' : 'border-transparent text-slate-400 dark:text-slate-500'}`}
          >
            Próximas
          </button>
          <button
            onClick={() => setTab('past')}
            className={`flex-1 pb-3 text-center border-b-2 font-semibold ${tab === 'past' ? 'border-primary text-primary' : 'border-transparent text-slate-400 dark:text-slate-500'}`}
          >
            Pasadas
          </button>
        </div>
      </header>

      <main className="p-4 space-y-6">
        <div className="relative">
          <span className="material-icons-outlined absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">search</span>
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full pl-12 pr-4 py-3 bg-slate-100 dark:bg-slate-800 border-none rounded-2xl focus:ring-2 focus:ring-primary/50 text-slate-600 dark:text-slate-300 placeholder:text-slate-400"
            placeholder="Buscar por nombre o fecha"
            type="text"
          />
        </div>

        <div className="flex justify-between items-center">
          <h2 className="text-lg font-bold text-slate-800 dark:text-white">{tab === 'upcoming' ? 'Reservas próximas' : 'Reservas pasadas'}</h2>
          <span className="text-sm text-[#00B4BB] font-medium">{filteredBookings.length} reservas</span>
        </div>

        <div className="space-y-6">
          {loading ? (
            <div className="space-y-6">
              <Skeleton className="h-44 rounded-3xl" />
              <Skeleton className="h-44 rounded-3xl" />
            </div>
          ) : filteredBookings.length === 0 ? (
            <EmptyState
              icon="event_busy"
              title={query ? 'Sin resultados' : (tab === 'upcoming' ? 'Sin reservas próximas' : 'Sin reservas pasadas')}
              description={query ? `No hay reservas que coincidan con "${query}".` : 'Cuando hagas una reserva aparecerá aquí.'}
              action={query ? undefined : { label: 'Explorar lugares', onClick: () => navigate('/user/home') }}
            />
          ) : (
            filteredBookings.map((booking) => (
              <div key={booking.id} className="bg-white dark:bg-surface-dark rounded-3xl overflow-hidden shadow-md border border-slate-100 dark:border-slate-800">
                <div className="relative h-44">
                  <img alt={booking.venueName} className="w-full h-full object-cover" src={booking.image} />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent"></div>
                  <div className="absolute bottom-4 left-4 right-4 flex justify-between items-end">
                    <div>
                      <h3 className="text-white font-bold text-lg leading-tight">{booking.venueName}</h3>
                      <div className="flex items-center text-white/90 text-xs mt-1">
                        <span className="material-icons-outlined text-sm mr-1">place</span>
                        {booking.location}
                      </div>
                    </div>
                    <span
                      className="text-white text-[10px] font-bold px-3 py-1.5 rounded-lg uppercase tracking-wider"
                      style={{ backgroundColor: booking.statusColor }}
                    >
                      {booking.status}
                    </span>
                  </div>
                </div>
                <div className="p-4">
                  <div className="flex justify-between text-slate-600 dark:text-slate-400 text-sm mb-4">
                    <div className="flex items-center gap-2">
                      <span className="material-icons-outlined text-primary text-lg">calendar_today</span>
                      {booking.date}
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="material-icons-outlined text-primary text-lg">schedule</span>
                      {booking.time}
                    </div>
                  </div>
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <p className="text-slate-800 dark:text-white font-medium">Total: <span className="font-bold text-lg">${booking.totalPrice.toLocaleString()}</span></p>
                    <div className="flex gap-2 flex-wrap">
                      {tab === 'past' && (
                        <button
                          onClick={() => navigate('/user/rate', { state: { venueId: booking.venueId, venueName: booking.venueName, image: booking.image, date: booking.date, time: booking.time } })}
                          className="bg-yellow-400 hover:bg-yellow-500 text-white px-4 py-2 rounded-xl text-sm font-semibold transition-colors flex items-center gap-1"
                        >
                          <span className="material-icons-outlined text-base">star</span>
                          Valorar
                        </button>
                      )}
                      <button
                        onClick={() => navigate('/user/invitations/create')}
                        className="bg-[#5EB962] hover:bg-green-600 text-white px-4 py-2 rounded-xl text-sm font-semibold transition-colors"
                      >
                        Invitaciones
                      </button>
                      <button
                        onClick={() => setSelectedBooking(booking)}
                        className="bg-primary hover:bg-orange-600 text-white px-4 py-2 rounded-xl text-sm font-semibold transition-colors"
                      >
                        Ver detalles
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </main>
    </Layout>
  );
};

export default Bookings;
