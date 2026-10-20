
import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import ProviderLayout from '../../components/ProviderLayout';
import { toast } from 'sonner';
import { supabase } from '../../lib/supabaseClient';
import { useUser } from '../../context/UserContext';
import {
  getBlockedDatesForMonth,
  getBookedDatesForMonth,
  blockDate,
  unblockDate,
} from '../../src/services/availabilityService';
import { getProviderVenues } from '../../src/services/providerService';
import BulkBlockDatesModal from '../../components/BulkBlockDatesModal';

const MONTH_NAMES = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre',
];

const pad = (n: number) => String(n).padStart(2, '0');
const toDateStr = (y: number, m: number, d: number) => `${y}-${pad(m + 1)}-${pad(d)}`;

const AvailabilityCalendar: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useUser();
  const [searchParams, setSearchParams] = useSearchParams();
  const isWizard = searchParams.get('wizard') === 'true';
  const venueId = searchParams.get('venueId');

  const today = new Date();
  const todayStr = `${today.getFullYear()}-${pad(today.getMonth() + 1)}-${pad(today.getDate())}`;
  const isPastDate = (dateStr: string) => dateStr < todayStr;

  const [year, setYear] = useState(today.getFullYear());
  const [month, setMonth] = useState(today.getMonth()); // 0-indexed
  const isCurrentOrPastMonth =
    year < today.getFullYear() || (year === today.getFullYear() && month <= today.getMonth());
  const [blockedDates, setBlockedDates] = useState<Set<string>>(new Set());
  const [bookedDates, setBookedDates] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(false);
  const [venueName, setVenueName] = useState<string>('');
  const [venues, setVenues] = useState<Array<{ id: string; name: string }>>([]);
  const [bulkOpen, setBulkOpen] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);

  // Load provider venues for the selector
  useEffect(() => {
    if (!user?.id) return;
    getProviderVenues(user.id)
      .then((rows: any[]) => setVenues((rows || []).map(v => ({ id: v.id, name: v.name }))))
      .catch(() => setVenues([]));
  }, [user?.id]);

  // Load venue name
  useEffect(() => {
    if (!venueId) { setVenueName(''); return; }
    supabase
      .from('venues')
      .select('name')
      .eq('id', venueId)
      .single()
      .then(({ data }) => {
        if (data) setVenueName(data.name);
      });
  }, [venueId]);

  // Load blocked + booked dates for current month/year
  useEffect(() => {
    if (!venueId) { setBlockedDates(new Set()); setBookedDates(new Set()); return; }
    let cancelled = false;
    setLoading(true);
    Promise.all([
      getBlockedDatesForMonth(venueId, year, month),
      getBookedDatesForMonth(venueId, year, month),
    ]).then(([blocked, booked]) => {
      if (!cancelled) {
        setBlockedDates(blocked);
        setBookedDates(booked);
        setLoading(false);
      }
    });
    return () => { cancelled = true; };
  }, [venueId, year, month, reloadKey]);

  const daysInMonth = useMemo(() => new Date(year, month + 1, 0).getDate(), [year, month]);
  // Day-of-week of the 1st (0=Sunday). Convert to Monday-first offset.
  const firstDayOffset = useMemo(() => {
    const dow = new Date(year, month, 1).getDay();
    return (dow + 6) % 7; // L=0 ... D=6
  }, [year, month]);

  const goPrevMonth = () => {
    if (isCurrentOrPastMonth) return;
    if (month === 0) { setYear(y => y - 1); setMonth(11); }
    else setMonth(m => m - 1);
  };
  const goNextMonth = () => {
    if (month === 11) { setYear(y => y + 1); setMonth(0); }
    else setMonth(m => m + 1);
  };

  const toggleBlockedDate = async (day: number) => {
    if (!venueId) {
      toast.error('Selecciona primero un espacio');
      return;
    }
    const dateStr = toDateStr(year, month, day);
    if (isPastDate(dateStr)) {
      toast.error('No es posible bloquear o modificar fechas pasadas');
      return;
    }
    if (bookedDates.has(dateStr)) {
      toast.error('Este día ya tiene una reserva confirmada');
      return;
    }
    const wasBlocked = blockedDates.has(dateStr);
    // optimistic
    setBlockedDates(prev => {
      const next = new Set(prev);
      if (wasBlocked) next.delete(dateStr); else next.add(dateStr);
      return next;
    });
    try {
      if (wasBlocked) {
        await unblockDate(venueId, dateStr);
        toast.success(`Día ${day} desbloqueado`);
      } else {
        await blockDate(venueId, dateStr);
        toast.success(`Día ${day} bloqueado`);
      }
    } catch (e: any) {
      // revert
      setBlockedDates(prev => {
        const next = new Set(prev);
        if (wasBlocked) next.add(dateStr); else next.delete(dateStr);
        return next;
      });
      toast.error(e.message || 'No se pudo guardar el cambio');
    }
  };

  const handleVenueChange = (id: string) => {
    const next = new URLSearchParams(searchParams);
    if (id) next.set('venueId', id); else next.delete('venueId');
    setSearchParams(next, { replace: true });
  };

  const Content = (
    <div className="p-6 space-y-10 max-w-lg mx-auto pb-10">
      {isWizard && (
        <div className="animate-in fade-in duration-500">
          <div className="flex justify-between items-end mb-3">
            <span className="text-sm font-bold text-slate-900 dark:text-white tracking-tight uppercase">Progreso</span>
            <span className="text-xs font-bold text-primary uppercase tracking-widest">Paso 4 de 4</span>
          </div>
          <div className="w-full h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
            <div className="bg-primary h-full rounded-full transition-all duration-700 shadow-[0_0_10px_rgba(242,107,58,0.4)] w-full"></div>
          </div>
        </div>
      )}

      {venues.length > 0 && !isWizard && (
        <div className="bg-white dark:bg-surface-dark rounded-[24px] p-4 shadow-sm border border-slate-100 dark:border-slate-800">
          <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1 block mb-2">Espacio</label>
          <select
            value={venueId || ''}
            onChange={(e) => handleVenueChange(e.target.value)}
            className="w-full p-4 bg-slate-50 dark:bg-slate-800 rounded-2xl text-slate-800 dark:text-white font-bold tracking-tight outline-none border-0"
          >
            <option value="">Selecciona un espacio…</option>
            {venues.map(v => (
              <option key={v.id} value={v.id}>{v.name}</option>
            ))}
          </select>
        </div>
      )}

      {!venueId && venues.length === 0 && (
        <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-2xl p-4 text-sm text-amber-800 dark:text-amber-200">
          Aún no tienes espacios. Crea uno desde "Mis espacios" para gestionar su disponibilidad.
        </div>
      )}

      <div className="bg-white dark:bg-surface-dark rounded-[32px] p-6 shadow-sm border border-slate-100 dark:border-slate-800 flex items-center justify-between group transition-all">
        <button
          onClick={goPrevMonth}
          disabled={isCurrentOrPastMonth}
          className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-slate-50 dark:hover:bg-slate-800 transition-all text-slate-400 active:scale-75 disabled:opacity-30 disabled:cursor-not-allowed"
          aria-label="Mes anterior"
        >
          <span className="material-icons-outlined">chevron_left</span>
        </button>
        <div className="flex items-center gap-3 font-bold text-lg dark:text-white tracking-tight">
          <span>{MONTH_NAMES[month]} {year}</span>
          <span className="material-icons-outlined text-secondary text-2xl">calendar_today</span>
        </div>
        <button
          onClick={goNextMonth}
          className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-slate-50 dark:hover:bg-slate-800 transition-all text-slate-400 active:scale-75"
          aria-label="Mes siguiente"
        >
          <span className="material-icons-outlined">chevron_right</span>
        </button>
      </div>

      <div className="bg-white dark:bg-surface-dark rounded-[36px] p-8 shadow-sm border border-slate-100 dark:border-slate-800">
        <div className="grid grid-cols-7 gap-y-6 text-center text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-8">
          <div>L</div><div>M</div><div>M</div><div>J</div><div>V</div><div>S</div><div>D</div>
        </div>
        <div className={`grid grid-cols-7 gap-y-4 text-center text-sm font-bold dark:text-white ${loading ? 'opacity-50' : ''}`}>
          {Array.from({ length: firstDayOffset }).map((_, i) => (
            <div key={`empty-${i}`} />
          ))}
          {Array.from({ length: daysInMonth }, (_, i) => i + 1).map((day) => {
            const dateStr = toDateStr(year, month, day);
            const isBlocked = blockedDates.has(dateStr);
            const isBooked = bookedDates.has(dateStr);
            const isPast = isPastDate(dateStr);
            const isToday =
              day === today.getDate() &&
              month === today.getMonth() &&
              year === today.getFullYear();

            let classes = "w-10 h-10 flex items-center justify-center mx-auto rounded-full transition-all cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800 active:scale-75";
            if (isBooked) {
              classes = "w-10 h-10 bg-primary text-white flex items-center justify-center mx-auto rounded-[14px] cursor-not-allowed";
            } else if (isPast) {
              classes = "w-10 h-10 text-slate-300 dark:text-slate-600 flex items-center justify-center mx-auto rounded-full cursor-not-allowed";
            } else if (isBlocked) {
              classes = "w-10 h-10 bg-slate-900 dark:bg-slate-700 text-white flex items-center justify-center mx-auto rounded-[14px] cursor-pointer active:scale-90 line-through";
            } else if (isToday) {
              classes = "w-10 h-10 border-2 border-primary text-primary rounded-full flex items-center justify-center mx-auto cursor-pointer active:scale-90";
            }

            return (
              <div
                key={day}
                className={classes}
                onClick={() => !loading && !isBooked && !isPast && toggleBlockedDate(day)}
                title={isBooked ? 'Reserva confirmada' : isPast ? 'Fecha pasada' : undefined}
              >
                {day}
              </div>
            );
          })}
        </div>

        <div className="mt-8 flex flex-wrap justify-center gap-x-5 gap-y-3 px-2">
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded-full border-2 border-primary"></div>
            <span className="text-[10px] font-bold text-slate-600 dark:text-slate-300 uppercase tracking-wider">Hoy</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded-md bg-primary"></div>
            <span className="text-[10px] font-bold text-slate-600 dark:text-slate-300 uppercase tracking-wider">Reservado</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded-md bg-slate-900 dark:bg-slate-700"></div>
            <span className="text-[10px] font-bold text-slate-600 dark:text-slate-300 uppercase tracking-wider">Bloqueado</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded-full bg-slate-200 dark:bg-slate-700"></div>
            <span className="text-[10px] font-bold text-slate-600 dark:text-slate-300 uppercase tracking-wider">Disponible</span>
          </div>
        </div>

        <p className="text-center text-[11px] text-slate-400 mt-6">
          Toca un día para bloquear o desbloquear.
        </p>

        <button
          onClick={() => {
            if (!venueId) { toast.error('Selecciona primero un espacio'); return; }
            setBulkOpen(true);
          }}
          className="mt-4 w-full py-3.5 rounded-2xl bg-slate-900 dark:bg-slate-700 text-white font-bold text-xs uppercase tracking-widest flex items-center justify-center gap-2 active:scale-[0.98] transition-all"
        >
          <span className="material-icons-outlined text-[18px]">event_busy</span>
          Bloqueo por rango o recurrente
        </button>
      </div>

      <BulkBlockDatesModal
        open={bulkOpen}
        venueId={venueId}
        onClose={() => setBulkOpen(false)}
        onSaved={() => setReloadKey((k) => k + 1)}
      />
    </div>
  );

  if (isWizard) {
    return (
      <div className="flex flex-col min-h-screen bg-background-light dark:bg-background-dark max-w-md mx-auto shadow-2xl relative transition-colors overflow-hidden border-x border-slate-100 dark:border-slate-800">
        <header className="sticky top-0 z-50 bg-white/90 dark:bg-surface-dark/90 backdrop-blur-md border-b border-slate-100 dark:border-slate-800 px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button onClick={() => navigate(-1)} className="p-2 -ml-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors active:scale-90">
              <span className="material-icons-outlined block">arrow_back</span>
            </button>
            <h1 className="text-lg font-bold text-slate-900 dark:text-white font-display tracking-tight">Disponibilidad</h1>
          </div>
          <button onClick={() => navigate('/provider/dashboard')} className="p-2 -mr-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors">
            <span className="material-icons-outlined block">close</span>
          </button>
        </header>

        <main className="flex-1 pb-32 overflow-y-auto no-scrollbar">
          {Content}
        </main>

        <footer className="fixed bottom-0 left-0 right-0 bg-white/95 dark:bg-surface-dark/95 backdrop-blur-xl border-t border-slate-100 dark:border-slate-800 px-6 py-6 flex gap-4 max-w-md mx-auto z-[60]">
          <button
            onClick={() => navigate('/provider/spaces')}
            className="flex-1 py-4 bg-primary text-white font-bold text-[11px] uppercase tracking-[0.15em] rounded-2xl shadow-xl shadow-primary/20 transition-all active:scale-95 hover:bg-orange-600"
          >
            Finalizar
          </button>
        </footer>
      </div>
    );
  }

  return (
    <ProviderLayout>
      <header className="sticky top-0 z-50 bg-white/80 dark:bg-surface-dark/80 backdrop-blur-xl px-6 py-5 flex items-center justify-between border-b border-slate-100 dark:border-slate-800 transition-colors">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate(-1)} className="w-11 h-11 flex items-center justify-center rounded-2xl bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 transition-all active:scale-90 shadow-sm border border-slate-100 dark:border-slate-800">
            <span className="material-icons-outlined text-xl">arrow_back</span>
          </button>
          <div>
            <h1 className="text-lg font-bold leading-tight dark:text-white font-display tracking-tight">Disponibilidad</h1>
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">{venueName || 'Espacio'}</p>
          </div>
        </div>
      </header>
      {Content}
    </ProviderLayout>
  );
};

export default AvailabilityCalendar;
