
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import ProviderLayout from '../../components/ProviderLayout';
import { toast } from 'sonner';
import ConfirmationDialog from '../../components/ui/ConfirmationDialog';
import { useUser } from '../../context/UserContext';
import { getProviderBookings } from '../../src/services/providerService';

const ReceivedBookings: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useUser();
  const [rejectingBookingId, setRejectingBookingId] = useState<any | null>(null);
  const [bookings, setBookings] = useState<any[]>([]);

  useEffect(() => {
    if (user?.id) {
      getProviderBookings(user.id).then(data => {
        setBookings(data.map(b => ({
          id: b.id,
          guest: b.profiles?.name || 'Invitado',
          email: b.profiles?.email || '',
          phone: '', // Needs profile phone in DB later
          avatar: 'https://i.pravatar.cc/150',
          venue: b.venues?.name || 'Espacio',
          date: b.event_date,
          people: b.guest_count,
          price: b.total_price,
          timeAgo: b.created_at
        })));
      });
    }
  }, [user]);

  const handleConfirm = (id: number) => {
    // Implement confirm logic later (Phase 2/3)
    setBookings(prev => prev.filter(b => b.id !== id));
    toast.success('Reserva confirmada con éxito');
  };

  const handleReject = (id: number) => {
    setBookings(prev => prev.filter(b => b.id !== id));
    toast.error('Reserva rechazada');
    setRejectingBookingId(null);
  };

  return (
    <ProviderLayout>
      <ConfirmationDialog
        isOpen={rejectingBookingId !== null}
        onClose={() => setRejectingBookingId(null)}
        onConfirm={() => rejectingBookingId && handleReject(rejectingBookingId)}
        title="Rechazar reserva"
        message="¿Estás seguro de que deseas rechazar esta reserva? Esta acción no se puede deshacer."
        confirmText="Rechazar"
      />
      <header className="bg-white dark:bg-card-dark px-4 pt-10 pb-4 flex items-center justify-between sticky top-0 z-30 shadow-sm transition-colors">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate(-1)} className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full">
            <span className="material-icons-round text-slate-700 dark:text-slate-300">arrow_back</span>
          </button>
          <h1 className="text-xl font-bold text-slate-800 dark:text-white font-display tracking-tight">Reservas Recibidas</h1>
        </div>
        <button className="p-2 text-secondary">
          <span className="material-icons-round">filter_alt</span>
        </button>
      </header>

      <div className="bg-white dark:bg-card-dark border-b border-slate-100 dark:border-slate-800 flex">
        <button className="flex-1 py-3 text-sm font-semibold border-b-2 border-primary text-primary">Pendientes</button>
        <button className="flex-1 py-3 text-sm font-semibold text-slate-400 dark:text-slate-500">Confirmadas</button>
        <button className="flex-1 py-3 text-sm font-semibold text-slate-400 dark:text-slate-500">Canceladas</button>
      </div>

      <div className="px-4 py-4">
        <div className="relative">
          <span className="material-icons-round absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 text-xl">search</span>
          <input 
            className="w-full pl-12 pr-4 py-3 bg-white dark:bg-card-dark border-none rounded-2xl shadow-sm focus:ring-2 focus:ring-primary/20 text-sm dark:text-white transition-all" 
            placeholder="Buscar reservas" 
            type="text"
          />
        </div>
      </div>

      <main className="px-4 space-y-4 pb-8">
        {bookings.map((booking) => (
          <div key={booking.id} className="bg-white dark:bg-card-dark rounded-2xl p-5 shadow-sm border-l-4 border-primary transition-all hover:shadow-md">
            <div className="flex justify-between items-start mb-5">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-orange-50 dark:bg-orange-900/30 flex items-center justify-center text-primary shadow-sm">
                  <span className="material-icons-round">schedule</span>
                </div>
                <div>
                  <p className="font-bold text-slate-800 dark:text-white leading-tight">Pendiente</p>
                  <p className="text-[10px] text-slate-400 uppercase tracking-widest font-bold">{booking.timeAgo}</p>
                </div>
              </div>
              <span className="text-primary font-bold text-xl font-display">${booking.price}</span>
            </div>

            <div className="flex items-start gap-4 mb-6">
              <img alt={booking.guest} className="w-16 h-16 rounded-full object-cover ring-2 ring-slate-100 dark:ring-slate-800" src={booking.avatar} loading="lazy" />
              <div className="flex-1 min-w-0">
                <h3 className="font-bold text-slate-800 dark:text-white text-base truncate">{booking.guest}</h3>
                <div className="flex items-center gap-2 text-xs text-slate-500 mt-1.5 font-medium">
                  <span className="material-icons-outlined text-sm text-secondary">mail</span>
                  <span className="truncate">{booking.email}</span>
                </div>
                <div className="flex items-center gap-2 text-xs text-slate-500 mt-1.5 font-medium">
                  <span className="material-icons-outlined text-sm text-secondary">call</span>
                  <span>{booking.phone}</span>
                </div>
              </div>
            </div>

            <div className="bg-slate-50 dark:bg-slate-800/40 rounded-2xl p-4 mb-5 space-y-3">
              <div className="flex items-center gap-3">
                <span className="material-icons-round text-secondary text-lg">home</span>
                <span className="font-bold text-sm text-slate-800 dark:text-white">{booking.venue}</span>
              </div>
              <div className="flex items-center gap-3">
                <span className="material-icons-round text-slate-400 text-lg">calendar_month</span>
                <span className="text-xs font-semibold text-slate-600 dark:text-slate-400">{booking.date}</span>
              </div>
              <div className="flex items-center gap-3">
                <span className="material-icons-round text-slate-400 text-lg">group</span>
                <span className="text-xs font-semibold text-slate-600 dark:text-slate-400">{booking.people} personas</span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <button 
                onClick={() => setRejectingBookingId(booking.id)}
                className="py-3.5 px-4 rounded-xl border-2 border-primary text-primary font-bold text-sm hover:bg-primary/5 transition-all active:scale-[0.98]"
              >
                Rechazar
              </button>
              <button 
                onClick={() => handleConfirm(booking.id)}
                className="py-3.5 px-4 rounded-xl bg-primary text-white font-bold text-sm hover:bg-orange-600 transition-all shadow-lg shadow-primary/20 active:scale-[0.98]"
              >
                Confirmar
              </button>
            </div>
          </div>
        ))}
      </main>
    </ProviderLayout>
  );
};

export default ReceivedBookings;
