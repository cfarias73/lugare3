import React, { useState } from 'react';
import { toast } from 'sonner';
import {
  bulkBlockDates,
  enumerateDates,
  enumerateRecurringDates,
  getBookedDatesInRange,
} from '../src/services/availabilityService';

interface Props {
  open: boolean;
  venueId: string | null;
  onClose: () => void;
  onSaved: () => void;
}

type Mode = 'range' | 'recurring';

const WEEKDAYS = [
  { value: 1, label: 'L' },
  { value: 2, label: 'M' },
  { value: 3, label: 'M' },
  { value: 4, label: 'J' },
  { value: 5, label: 'V' },
  { value: 6, label: 'S' },
  { value: 0, label: 'D' },
];

const today = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};

const BulkBlockDatesModal: React.FC<Props> = ({ open, venueId, onClose, onSaved }) => {
  const [mode, setMode] = useState<Mode>('range');
  const [start, setStart] = useState<string>(today());
  const [end, setEnd] = useState<string>(today());
  const [weekdays, setWeekdays] = useState<number[]>([6, 0]); // sáb y dom
  const [loading, setLoading] = useState(false);

  if (!open) return null;

  const toggleWeekday = (d: number) => {
    setWeekdays((prev) => (prev.includes(d) ? prev.filter((x) => x !== d) : [...prev, d]));
  };

  const handleSubmit = async () => {
    if (!venueId) {
      toast.error('Selecciona primero un espacio');
      return;
    }
    if (!start || !end || end < start) {
      toast.error('Revisa las fechas (la fecha final debe ser igual o posterior a la inicial)');
      return;
    }
    const todayStr = today();
    if (start < todayStr) {
      toast.error('No es posible bloquear fechas pasadas');
      return;
    }
    if (mode === 'recurring' && weekdays.length === 0) {
      toast.error('Selecciona al menos un día de la semana');
      return;
    }
    setLoading(true);
    try {
      const all =
        mode === 'range'
          ? enumerateDates(start, end)
          : enumerateRecurringDates(start, end, weekdays);

      if (all.length === 0) {
        toast.info('No hay fechas que coincidan en ese rango');
        return;
      }
      if (all.length > 366) {
        toast.error('El rango es demasiado grande (máximo ~1 año)');
        return;
      }

      // No bloquear días con reserva confirmada
      const booked = await getBookedDatesInRange(venueId, start, end);
      const toBlock = all.filter((d) => !booked.has(d));
      const skipped = all.length - toBlock.length;

      if (toBlock.length === 0) {
        toast.error('Todas esas fechas ya tienen reservas confirmadas');
        return;
      }

      await bulkBlockDates(venueId, toBlock);
      toast.success(
        `${toBlock.length} día(s) bloqueado(s)` + (skipped > 0 ? ` · ${skipped} omitido(s) por reserva` : '')
      );
      onSaved();
      onClose();
    } catch (e: any) {
      console.error(e);
      toast.error(e.message || 'No se pudieron bloquear las fechas');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[80] bg-black/50 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-6">
      <div className="w-full sm:max-w-md bg-white dark:bg-surface-dark rounded-t-[28px] sm:rounded-[28px] shadow-2xl p-6 space-y-6 max-h-[90vh] overflow-y-auto">
        <div className="flex items-start justify-between">
          <div>
            <h3 className="text-lg font-bold dark:text-white font-display tracking-tight">Bloquear fechas</h3>
            <p className="text-xs text-slate-400 mt-1">
              Bloquea un rango o días recurrentes (las reservas confirmadas se omiten).
            </p>
          </div>
          <button
            onClick={onClose}
            className="w-9 h-9 flex items-center justify-center rounded-full bg-slate-100 dark:bg-slate-800 active:scale-90"
            aria-label="Cerrar"
          >
            <span className="material-icons-outlined text-[20px]">close</span>
          </button>
        </div>

        <div className="grid grid-cols-2 gap-2 bg-slate-100 dark:bg-slate-800 p-1 rounded-2xl">
          <button
            onClick={() => setMode('range')}
            className={`py-2.5 rounded-xl text-xs font-bold tracking-wide transition-all ${
              mode === 'range' ? 'bg-white dark:bg-slate-700 text-primary shadow-sm' : 'text-slate-500'
            }`}
          >
            Rango de fechas
          </button>
          <button
            onClick={() => setMode('recurring')}
            className={`py-2.5 rounded-xl text-xs font-bold tracking-wide transition-all ${
              mode === 'recurring' ? 'bg-white dark:bg-slate-700 text-primary shadow-sm' : 'text-slate-500'
            }`}
          >
            Recurrente
          </button>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">
              {mode === 'range' ? 'Desde' : 'Inicio'}
            </label>
            <input
              type="date"
              min={today()}
              value={start}
              onChange={(e) => setStart(e.target.value)}
              className="w-full bg-slate-50 dark:bg-slate-800 rounded-xl px-3 py-3 text-sm font-bold text-slate-900 dark:text-white outline-none"
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">
              {mode === 'range' ? 'Hasta' : 'Fin'}
            </label>
            <input
              type="date"
              min={start || today()}
              value={end}
              onChange={(e) => setEnd(e.target.value)}
              className="w-full bg-slate-50 dark:bg-slate-800 rounded-xl px-3 py-3 text-sm font-bold text-slate-900 dark:text-white outline-none"
            />
          </div>
        </div>

        {mode === 'recurring' && (
          <div className="space-y-2">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">
              Repetir cada
            </label>
            <div className="flex gap-2 justify-between">
              {WEEKDAYS.map((d) => {
                const active = weekdays.includes(d.value);
                return (
                  <button
                    key={d.value}
                    onClick={() => toggleWeekday(d.value)}
                    className={`flex-1 py-3 rounded-xl text-sm font-bold transition-all ${
                      active
                        ? 'bg-primary text-white shadow'
                        : 'bg-slate-50 dark:bg-slate-800 text-slate-500'
                    }`}
                  >
                    {d.label}
                  </button>
                );
              })}
            </div>
            <p className="text-[11px] text-slate-400 leading-snug ml-1">
              Ej: bloquear todos los lunes hasta fin de año.
            </p>
          </div>
        )}

        <div className="flex gap-3 pt-2">
          <button
            onClick={onClose}
            disabled={loading}
            className="flex-1 py-3.5 rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 font-bold text-sm"
          >
            Cancelar
          </button>
          <button
            onClick={handleSubmit}
            disabled={loading}
            className="flex-1 py-3.5 rounded-2xl bg-primary text-white font-bold text-sm shadow-lg shadow-primary/20 disabled:opacity-60"
          >
            {loading ? 'Bloqueando…' : 'Bloquear'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default BulkBlockDatesModal;
