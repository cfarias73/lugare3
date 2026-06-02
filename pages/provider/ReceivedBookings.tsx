
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import ProviderLayout from '../../components/ProviderLayout';
import { toast } from 'sonner';
import RejectBookingDialog from '../../components/ui/RejectBookingDialog';
import { useUser } from '../../context/UserContext';
import { getProviderBookings, updateBookingStatus, BookingStatus } from '../../src/services/providerService';
import { createNotification } from '../../src/services/notificationService';

type TabKey = 'pending' | 'confirmed' | 'cancelled';

const TABS: { key: TabKey; label: string; status: BookingStatus }[] = [
  { key: 'pending', label: 'Pendientes', status: 'pending' },
  { key: 'confirmed', label: 'Confirmadas', status: 'confirmed' },
  { key: 'cancelled', label: 'Canceladas', status: 'cancelled' },
];

const fallbackAvatar = 'https://i.pravatar.cc/150';

const ReceivedBookings: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useUser();
  const [tab, setTab] = useState<TabKey>('pending');
  const [search, setSearch] = useState('');
  const [bookings, setBookings] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [rejectingBookingId, setRejectingBookingId] = useState<string | null>(null);
  const [actioningId, setActioningId] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!user?.id) return;
    setLoading(true);
    try {
      const status = TABS.find(t => t.key === tab)!.status;
      const data = await getProviderBookings(user.id, status);
      setBookings(data);
    } catch (e: any) {
      console.error(e);
      toast.error(e.message ?? 'Error al cargar reservas');
    } finally {
      setLoading(false);
    }
  }, [user?.id, tab]);

  useEffect(() => { load(); }, [load]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return bookings;
    return bookings.filter(b =>
      (b.profiles?.name || '').toLowerCase().includes(q) ||
      (b.venues?.name || '').toLowerCase().includes(q)
    );
  }, [bookings, search]);

  const handleConfirm = async (booking: any) => {
    if (!user?.id) return;
    setActioningId(booking.id);
    try {
      await updateBookingStatus(user.id, booking.id, 'confirmed');
      await createNotification({
        userId: booking.user_id,
        title: 'Reserva confirmada',
        message: `Tu reserva en ${booking.venues?.name ?? 'el espacio'} para el ${booking.event_date} fue confirmada.`,
        type: 'success',
        link: '/user/bookings',
      });
      toast.success('Reserva confirmada');
      setBookings(prev => prev.filter(b => b.id !== booking.id));
    } catch (e: any) {
      console.error(e);
      toast.error(e.message ?? 'Error al confirmar');
    } finally {
      setActioningId(null);
    }
  };

  const handleReject = async (reason: string) => {
    if (!user?.id || !rejectingBookingId) return;
    const booking = bookings.find(b => b.id === rejectingBookingId);
    if (!booking) return;
    setActioningId(booking.id);
    try {
      await updateBookingStatus(user.id, booking.id, 'cancelled', reason);
      await createNotification({
        userId: booking.user_id,
        title: 'Reserva rechazada',
        message: `Tu reserva en ${booking.venues?.name ?? 'el espacio'} para el ${booking.event_date} fue rechazada. Motivo: ${reason}`,
        type: 'error',
        link: '/user/bookings',
      });
      toast.success('Reserva rechazada');
      setBookings(prev => prev.filter(b => b.id !== booking.id));
    } catch (e: any) {
      console.error(e);
      toast.error(e.message ?? 'Error al rechazar');
    } finally {
      setActioningId(null);
      setRejectingBookingId(null);
    }
  };

  return (
    <ProviderLayout>
      <RejectBookingDialog
        isOpen={rejectingBookingId !== null}
        onClose={() => setRejectingBookingId(null)}
        onConfirm={handleReject}
        busy={actioningId === rejectingBookingId}
      />

      <header className="bg-white dark:bg-card-dark px-4 pt-10 pb-4 flex items-center justify-between sticky top-0 z-30 shadow-sm transition-colors">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate(-1)} className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full">
            <span className="material-icons-round text-slate-700 dark:text-slate-300">arrow_back</span>
          </button>
          <h1 className="text-xl font-bold text-slate-800 dark:text-white font-display tracking-tight">Reservas Recibidas</h1>
        </div>
        <button onClick={load} className="p-2 text-secondary" aria-label="Refrescar">
          <span className="material-icons-round">refresh</span>
        </button>
      </header>

      <div className="bg-white dark:bg-card-dark border-b border-slate-100 dark:border-slate-800 flex">
        {TABS.map(t => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`flex-1 py-3 text-sm font-semibold transition-colors ${
              tab === t.key
                ? 'border-b-2 border-primary text-primary'
                : 'text-slate-400 dark:text-slate-500'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div className="px-4 py-4">
        <div className="relative">
          <span className="material-icons-round absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 text-xl">search</span>
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-12 pr-4 py-3 bg-white dark:bg-card-dark border-none rounded-2xl shadow-sm focus:ring-2 focus:ring-primary/20 text-sm dark:text-white transition-all"
            placeholder="Buscar por huésped o espacio"
            type="text"
          />
        </div>
      </div>

      <main className="px-4 space-y-4 pb-8">
        {loading && (
          <p className="text-center text-xs text-slate-400 font-bold uppercase tracking-widest py-12 animate-pulse">Cargando...</p>
        )}
        {!loading && filtered.length === 0 && (
          <div className="text-center py-16">
            <span className="material-icons-round text-5xl text-slate-300 dark:text-slate-700 mb-4">inbox</span>
            <p className="text-sm font-bold text-slate-500 dark:text-slate-400">
              {search ? 'Sin resultados' : `No hay reservas ${TABS.find(t => t.key === tab)!.label.toLowerCase()}`}
            </p>
          </div>
        )}
        {!loading && filtered.map((booking) => {
          const isPending = booking.status === 'pending';
          const isBusy = actioningId === booking.id;
          return (
            <div key={booking.id} className="bg-white dark:bg-card-dark rounded-2xl p-5 shadow-sm border-l-4 border-primary transition-all hover:shadow-md">
              <div className="flex justify-between items-start mb-5">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-orange-50 dark:bg-orange-900/30 flex items-center justify-center text-primary shadow-sm">
                    <span className="material-icons-round">
                      {booking.status === 'confirmed' ? 'check_circle' : booking.status === 'cancelled' ? 'cancel' : 'schedule'}
                    </span>
                  </div>
                  <div>
                    <p className="font-bold text-slate-800 dark:text-white leading-tight capitalize">
                      {booking.status === 'pending' ? 'Pendiente' : booking.status === 'confirmed' ? 'Confirmada' : 'Cancelada'}
                    </p>
                    <p className="text-[10px] text-slate-400 uppercase tracking-widest font-bold">
                      {new Date(booking.created_at).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                <span className="text-primary font-bold text-xl font-display">${booking.total_price}</span>
              </div>

              <div className="flex items-start gap-4 mb-6">
                <img
                  alt={booking.profiles?.name || 'Invitado'}
                  className="w-16 h-16 rounded-full object-cover ring-2 ring-slate-100 dark:ring-slate-800"
                  src={booking.profiles?.avatar_url || fallbackAvatar}
                  loading="lazy"
                />
                <div className="flex-1 min-w-0">
                  <h3 className="font-bold text-slate-800 dark:text-white text-base truncate">
                    {booking.profiles?.name || 'Invitado'}
                  </h3>
                  <div className="flex items-center gap-2 text-xs text-slate-500 mt-1.5 font-medium">
                    <span className="material-icons-outlined text-sm text-secondary">mail</span>
                    <span className="truncate">{booking.profiles?.email || '—'}</span>
                  </div>
                  {booking.profiles?.phone && (
                    <div className="flex items-center gap-2 text-xs text-slate-500 mt-1.5 font-medium">
                      <span className="material-icons-outlined text-sm text-secondary">call</span>
                      <span>{booking.profiles.phone}</span>
                    </div>
                  )}
                </div>
              </div>

              <div className="bg-slate-50 dark:bg-slate-800/40 rounded-2xl p-4 mb-5 space-y-3">
                <div className="flex items-center gap-3">
                  <span className="material-icons-round text-secondary text-lg">home</span>
                  <span className="font-bold text-sm text-slate-800 dark:text-white">{booking.venues?.name}</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="material-icons-round text-slate-400 text-lg">calendar_month</span>
                  <span className="text-xs font-semibold text-slate-600 dark:text-slate-400">
                    {booking.event_date} · {booking.start_time?.slice(0,5)}–{booking.end_time?.slice(0,5)}
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="material-icons-round text-slate-400 text-lg">group</span>
                  <span className="text-xs font-semibold text-slate-600 dark:text-slate-400">{booking.guest_count} personas</span>
                </div>
              </div>

              {isPending && (
                <div className="grid grid-cols-2 gap-3">
                  <button
                    disabled={isBusy}
                    onClick={() => setRejectingBookingId(booking.id)}
                    className="py-3.5 px-4 rounded-xl border-2 border-primary text-primary font-bold text-sm hover:bg-primary/5 transition-all active:scale-[0.98] disabled:opacity-50"
                  >
                    Rechazar
                  </button>
                  <button
                    disabled={isBusy}
                    onClick={() => handleConfirm(booking)}
                    className="py-3.5 px-4 rounded-xl bg-primary text-white font-bold text-sm hover:bg-orange-600 transition-all shadow-lg shadow-primary/20 active:scale-[0.98] disabled:opacity-50"
                  >
                    {isBusy ? '...' : 'Confirmar'}
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </main>
    </ProviderLayout>
  );
};

export default ReceivedBookings;
