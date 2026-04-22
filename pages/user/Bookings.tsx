
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../../components/Layout';
import { useUser } from '../../context/UserContext';
import { Skeleton } from '../../components/ui/Skeleton';
import { EmptyState } from '../../components/ui/EmptyState';
import { motion, AnimatePresence } from 'motion/react';

const BookingDetailModal: React.FC<{ booking: any; onClose: () => void }> = ({ booking, onClose }) => (
  <AnimatePresence>
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
      onClick={onClose}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.9 }}
        className="bg-white dark:bg-surface-dark rounded-[32px] p-6 shadow-2xl w-full max-w-md"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="text-xl font-bold mb-4 dark:text-white">Detalles de la Reserva</h2>
        <div className="space-y-4 text-sm dark:text-slate-300">
          <p><strong>Lugar:</strong> {booking.venueName}</p>
          <p><strong>Fecha:</strong> {booking.date}</p>
          <p><strong>Horario:</strong> {booking.time}</p>
          <p><strong>Ubicación:</strong> {booking.location}</p>
          <p><strong>Total:</strong> ${booking.totalPrice.toLocaleString()}</p>
        </div>
        <div className="mt-6 flex gap-3">
          <button className="flex-1 py-3 bg-slate-100 dark:bg-slate-800 rounded-xl font-bold dark:text-white">Descargar Contrato</button>
          <button className="flex-1 py-3 bg-primary text-white rounded-xl font-bold">Descargar Factura</button>
        </div>
        <button onClick={onClose} className="mt-4 w-full py-2 text-slate-500 font-medium">Cerrar</button>
      </motion.div>
    </motion.div>
  </AnimatePresence>
);

const Bookings: React.FC = () => {
  const navigate = useNavigate();
  const { bookings } = useUser();
  const [loading, setLoading] = useState(true);
  const [selectedBooking, setSelectedBooking] = useState<any>(null);

  useEffect(() => {
    const timer = setTimeout(() => setLoading(false), 1000);
    return () => clearTimeout(timer);
  }, []);

  return (
    <Layout>
      {selectedBooking && <BookingDetailModal booking={selectedBooking} onClose={() => setSelectedBooking(null)} />}
      <header className="sticky top-0 z-50 bg-white dark:bg-background-dark border-b border-slate-100 dark:border-slate-800 px-4 pt-4">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-xl font-bold text-slate-800 dark:text-white">Historial de Reservas</h1>
          <span className="material-icons-outlined text-primary cursor-pointer">filter_alt</span>
        </div>
        <div className="flex w-full">
          <button className="flex-1 pb-3 text-center border-b-2 border-primary text-primary font-semibold">
            Próximas
          </button>
          <button className="flex-1 pb-3 text-center border-b-2 border-transparent text-slate-400 dark:text-slate-500 font-medium">
            Pasadas
          </button>
        </div>
      </header>

      <main className="p-4 space-y-6">
        <div className="relative">
          <span className="material-icons-outlined absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">search</span>
          <input 
            className="w-full pl-12 pr-4 py-3 bg-slate-100 dark:bg-slate-800 border-none rounded-2xl focus:ring-2 focus:ring-primary/50 text-slate-600 dark:text-slate-300 placeholder:text-slate-400" 
            placeholder="Buscar por nombre o fecha" 
            type="text"
          />
        </div>

        <div className="flex justify-between items-center">
          <h2 className="text-lg font-bold text-slate-800 dark:text-white">Reservas próximas</h2>
          <span className="text-sm text-[#00B4BB] font-medium">{bookings.length} reservas</span>
        </div>

        <div className="space-y-6">
          {loading ? (
            <div className="space-y-6">
              <Skeleton className="h-44 rounded-3xl" />
              <Skeleton className="h-44 rounded-3xl" />
            </div>
          ) : bookings.length === 0 ? (
            <EmptyState 
              icon="event_busy"
              title="Sin reservas"
              description="Aún no tienes reservas próximas."
              action={{ label: 'Explorar lugares', onClick: () => navigate('/user/home') }}
            />
          ) : (
            bookings.map((booking) => (
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
                      style={{ backgroundColor: booking.statusColor || '#00B4BB' }}
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
                  <div className="flex items-center justify-between">
                    <p className="text-slate-800 dark:text-white font-medium">Total: <span className="font-bold text-lg">${booking.totalPrice.toLocaleString()}</span></p>
                    <div className="flex gap-2">
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
