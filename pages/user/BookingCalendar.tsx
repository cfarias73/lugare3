
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';

const PLACEHOLDER_IMAGE = 'https://images.unsplash.com/photo-1519167758481-83f550bb49b3?w=800';
import { supabase } from '../../lib/supabaseClient';
import { getBlockedDatesForMonth } from '../../src/services/availabilityService';
import { calcVenuePricing } from '../../src/utils/pricing';

const DEFAULT_SLOT_TIMES = {
  morning: { start: '08:00:00', end: '13:00:00', hours: 5 },
  afternoon: { start: '14:00:00', end: '19:00:00', hours: 5 },
  night: { start: '20:00:00', end: '02:00:00', hours: 6 },
};

const calcSlotHours = (startStr: string, endStr: string): number => {
  const [sh, sm] = startStr.split(':').map(Number);
  const [eh, em] = endStr.split(':').map(Number);
  let startMins = sh * 60 + (sm || 0);
  let endMins = eh * 60 + (em || 0);
  if (endMins <= startMins) {
    endMins += 24 * 60; // cruza la medianoche (ej. 20:00 a 02:00)
  }
  const diffHours = (endMins - startMins) / 60;
  return Math.max(1, Math.round(diffHours * 10) / 10);
};

const formatTimeShort = (timeStr: string) => {
  const parts = timeStr.split(':');
  return `${parts[0]}:${parts[1]}`;
};

const MONTH_NAMES = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre',
];

const pad = (n: number) => String(n).padStart(2, '0');
const toDateStr = (y: number, m: number, d: number) => `${y}-${pad(m + 1)}-${pad(d)}`;

const BookingCalendar: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const [searchParams] = useSearchParams();
  const servicesParam = searchParams.get('services') || '';

  const today = new Date();
  const [year, setYear] = useState(today.getFullYear());
  const [month, setMonth] = useState(today.getMonth());
  const [selectedDay, setSelectedDay] = useState<number | null>(null);
  const [selectedSlot, setSelectedSlot] = useState<'morning' | 'afternoon' | 'night' | null>(null);
  const [extraHours, setExtraHours] = useState<number>(0);
  const [guests, setGuests] = useState<number>(0);
  const [venue, setVenue] = useState<any>(null);
  const [blockedDates, setBlockedDates] = useState<Set<string>>(new Set());
  const [bookedDates, setBookedDates] = useState<Set<string>>(new Set());
  const guestsRef = useRef<HTMLInputElement>(null);

  const isUuid = id ? /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id) : false;

  useEffect(() => {
    if (!id || !isUuid) return;
    supabase
      .from('venues')
      .select('*, venue_images(image_url)')
      .eq('id', id)
      .single()
      .then(({ data }) => {
        if (data) {
          const mapped = {
            id: data.id,
            name: data.name,
            location: data.location || data.city,
            image: data.venue_images?.[0]?.image_url || PLACEHOLDER_IMAGE,
            price: Number(data.price_per_hour) || 0,
            rating: data.rating || 0,
            reviewsCount: data.reviews_count || 0,
            extraHourPrice: data.extra_hour_price != null ? Number(data.extra_hour_price) : Number(data.price_per_hour) || 0,
            basePrice: data.base_price != null ? Number(data.base_price) : null,
            baseCapacity: data.base_capacity != null ? Number(data.base_capacity) : null,
            maxCapacity: data.max_capacity != null ? Number(data.max_capacity) : (data.capacity ?? null),
            includedHours: Math.max(Number(data.included_hours) || 0, Number(data.min_hours) || 0) || 5,
            extraPersonPrice: data.extra_person_price != null ? Number(data.extra_person_price) : 0,
            maxExtraHours: data.max_extra_hours != null ? Number(data.max_extra_hours) : 6,
            schedules: data.schedules || null,
          };
          setVenue(mapped);
          if (mapped.baseCapacity) setGuests(mapped.baseCapacity);
        }
      });
  }, [id, isUuid]);

  // Scroll guest input into view when a slot is selected
  useEffect(() => {
    if (selectedSlot && guestsRef.current) {
      const timer = setTimeout(() => {
        guestsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [selectedSlot]);

  // Load blocked + booked dates for the visible month
  useEffect(() => {
    if (!id || !isUuid) {
      setBlockedDates(new Set());
      setBookedDates(new Set());
      return;
    }
    let cancelled = false;
    const start = toDateStr(year, month, 1);
    const end = toDateStr(year, month, new Date(year, month + 1, 0).getDate());

    Promise.all([
      getBlockedDatesForMonth(id, year, month),
      supabase
        .from('bookings')
        .select('event_date')
        .eq('venue_id', id)
        .in('status', ['pending', 'confirmed', 'paid'])
        .gte('event_date', start)
        .lte('event_date', end),
    ]).then(([blocked, { data: bookings }]) => {
      if (cancelled) return;
      setBlockedDates(blocked);
      setBookedDates(new Set((bookings || []).map((b: any) => b.event_date)));
    });
    return () => { cancelled = true; };
  }, [id, isUuid, year, month]);

  // Fecha mínima reservable: hoy (no se permiten fechas pasadas)
  const todayStr = toDateStr(today.getFullYear(), today.getMonth(), today.getDate());
  const isPastDate = (dateStr: string) => dateStr < todayStr;
  const isCurrentOrPastMonth =
    year < today.getFullYear() || (year === today.getFullYear() && month <= today.getMonth());

  const daysInMonth = useMemo(() => new Date(year, month + 1, 0).getDate(), [year, month]);
  const firstDayOffset = useMemo(() => {
    const dow = new Date(year, month, 1).getDay();
    return (dow + 6) % 7;
  }, [year, month]);

  const goPrevMonth = () => {
    if (isCurrentOrPastMonth) return;
    setSelectedDay(null);
    setSelectedSlot(null);
    if (month === 0) { setYear(y => y - 1); setMonth(11); }
    else setMonth(m => m - 1);
  };
  const goNextMonth = () => {
    setSelectedDay(null);
    setSelectedSlot(null);
    if (month === 11) { setYear(y => y + 1); setMonth(0); }
    else setMonth(m => m + 1);
  };

  const resolvedSlots = useMemo(() => {
    const s = venue?.schedules;
    const m = s?.morning;
    const a = s?.afternoon;
    const n = s?.night;

    const morningStart = m?.start ? (m.start.length === 5 ? `${m.start}:00` : m.start) : DEFAULT_SLOT_TIMES.morning.start;
    const morningEnd = m?.end ? (m.end.length === 5 ? `${m.end}:00` : m.end) : DEFAULT_SLOT_TIMES.morning.end;

    const afternoonStart = a?.start ? (a.start.length === 5 ? `${a.start}:00` : a.start) : DEFAULT_SLOT_TIMES.afternoon.start;
    const afternoonEnd = a?.end ? (a.end.length === 5 ? `${a.end}:00` : a.end) : DEFAULT_SLOT_TIMES.afternoon.end;

    const nightStart = n?.start ? (n.start.length === 5 ? `${n.start}:00` : n.start) : DEFAULT_SLOT_TIMES.night.start;
    const nightEnd = n?.end ? (n.end.length === 5 ? `${n.end}:00` : n.end) : DEFAULT_SLOT_TIMES.night.end;

    return {
      morning: {
        enabled: m?.enabled ?? true,
        start: morningStart,
        end: morningEnd,
        hours: calcSlotHours(morningStart, morningEnd),
        label: `${formatTimeShort(morningStart)} - ${formatTimeShort(morningEnd)}`,
      },
      afternoon: {
        enabled: a?.enabled ?? true,
        start: afternoonStart,
        end: afternoonEnd,
        hours: calcSlotHours(afternoonStart, afternoonEnd),
        label: `${formatTimeShort(afternoonStart)} - ${formatTimeShort(afternoonEnd)}`,
      },
      night: {
        enabled: n?.enabled ?? true,
        start: nightStart,
        end: nightEnd,
        hours: calcSlotHours(nightStart, nightEnd),
        label: `${formatTimeShort(nightStart)} - ${formatTimeShort(nightEnd)}`,
      },
    };
  }, [venue?.schedules]);

  const handleContinue = () => {
    if (selectedDay && selectedSlot) {
      if (isPastDate(toDateStr(year, month, selectedDay))) {
        alert('No es posible reservar en fechas pasadas. Selecciona una fecha a partir de hoy.');
        return;
      }
      const slot = resolvedSlots[selectedSlot];
      const totalHours = slot.hours + extraHours;
      const [eh, em, es] = slot.end.split(':').map(Number);
      const endDate = new Date(2000, 0, 1, eh, em, es);
      endDate.setHours(endDate.getHours() + extraHours);
      const padN = (n: number) => String(n).padStart(2, '0');
      const newEnd = `${padN(endDate.getHours())}:${padN(endDate.getMinutes())}:${padN(endDate.getSeconds())}`;
      const date = toDateStr(year, month, selectedDay);
      // Snapshot del desglose calculado en el calendario: evita que el Checkout
      // recalcule con valores que puedan no coincidir (p.ej. fallback distinto).
      const params = new URLSearchParams({
        date,
        start: slot.start,
        end: newEnd,
        hours: String(totalHours),
        guests: String(guests || venue.baseCapacity || 10),
        extra_hours: String(extraHours),
        slot_hours: String(slot.hours),
        subtotal: String(Math.round(estimatedTotal)),
      });
      if (servicesParam) params.set('services', servicesParam);
      navigate(`/user/checkout/${id}?${params.toString()}`);

    } else {
      alert('Por favor selecciona un día y un horario.');
    }
  };


  if (!venue) {
    return (
      <div className="min-h-screen flex items-center justify-center text-slate-500">
        Cargando espacio...
      </div>
    );
  }

  const extraPrice = Number(venue.extraHourPrice ?? venue.price) || 0;
  const slotHours = selectedSlot ? resolvedSlots[selectedSlot].hours : 0;
  const usingFlexible = venue.basePrice != null;
  const flexibleBreakdown = usingFlexible && selectedSlot
    ? calcVenuePricing({
        basePrice: venue.basePrice,
        baseCapacity: venue.baseCapacity || 0,
        includedHours: venue.includedHours || slotHours,
        extraPersonPrice: venue.extraPersonPrice || 0,
        extraHourPrice: venue.extraHourPrice || 0,
        guests: guests || venue.baseCapacity || 0,
        hours: slotHours + extraHours,
      })
    : null;
  const estimatedTotal = flexibleBreakdown
    ? flexibleBreakdown.total
    : (selectedSlot ? venue.price * slotHours + extraPrice * extraHours : venue.price * 5);

  return (
    <div className="bg-background-light dark:bg-background-dark text-slate-800 dark:text-slate-100 min-h-screen max-w-md mx-auto flex flex-col transition-colors">
      <header className="sticky top-0 z-50 bg-white dark:bg-background-dark border-b border-gray-100 dark:border-gray-800 px-4 pt-[calc(env(safe-area-inset-top,0px)+1rem)] pb-4 flex items-center">
        <button
          type="button"
          onClick={() => { if (window.history.length > 1) navigate(-1); else navigate(`/user/venue/${id}`); }}
          className="p-2 -ml-2 min-h-[44px] min-w-[44px] flex items-center justify-center rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 active:scale-95 transition-transform"
          aria-label="Volver"
        >
          <span className="material-icons-round text-xl">arrow_back_ios_new</span>
        </button>
        <h1 className="text-lg font-semibold ml-2 font-display">Calendario de Disponibilidad</h1>
      </header>

      <main className="pb-28 flex-1 overflow-y-auto">
        <section className="p-4 flex items-center space-x-4 border-b border-gray-100 dark:border-gray-800">
          <img alt="Venue" className="w-16 h-16 rounded-lg object-cover" src={venue.image} />
          <div className="flex-1">
            <h2 className="font-semibold text-base leading-tight">{venue.name}</h2>
            <div className="flex items-center text-xs text-gray-500 dark:text-gray-400 mt-1">
              <span className="material-icons-round text-[14px] mr-1 text-primary">location_on</span>
              {venue.location}
            </div>
            <div className="flex items-center mt-1">
              <div className="flex text-yellow-400">
                <span className="material-icons-round text-[14px]">star</span>
              </div>
              <span className="text-xs ml-1 font-medium">{venue.rating} ({venue.reviewsCount} reseñas)</span>
            </div>
          </div>
        </section>

        <section className="mt-4 px-4">
          <div className="flex items-center justify-between mb-6">
            <button
              onClick={goPrevMonth}
              disabled={isCurrentOrPastMonth}
              className="p-1 disabled:opacity-30 disabled:cursor-not-allowed"
            >
              <span className="material-icons-round">chevron_left</span>
            </button>
            <h3 className="font-semibold text-base">{MONTH_NAMES[month]} {year}</h3>
            <button onClick={goNextMonth} className="p-1"><span className="material-icons-round">chevron_right</span></button>
          </div>
          <div className="grid grid-cols-7 text-center text-xs font-medium text-gray-400 dark:text-gray-500 mb-2">
            <div>L</div><div>M</div><div>X</div><div>J</div><div>V</div><div>S</div><div>D</div>
          </div>
          <div className="grid grid-cols-7 gap-1 text-sm">
            {Array.from({ length: firstDayOffset }).map((_, i) => (
              <div key={`empty-${i}`} className="h-10" />
            ))}
            {Array.from({ length: daysInMonth }, (_, i) => i + 1).map((day) => {
              const dateStr = toDateStr(year, month, day);
              const isPast = isPastDate(dateStr);
              const isUnavailable = isPast || blockedDates.has(dateStr) || bookedDates.has(dateStr);
              return (
                <button
                  key={day}
                  onClick={() => !isUnavailable && setSelectedDay(day)}
                  disabled={isUnavailable}
                  className={`h-10 flex items-center justify-center rounded-lg transition-all ${
                    isUnavailable
                      ? `text-slate-300 dark:text-slate-600 cursor-not-allowed ${isPast ? '' : 'line-through'}`
                      : selectedDay === day
                        ? 'bg-primary text-white font-bold shadow-md'
                        : 'hover:bg-slate-100 dark:hover:bg-slate-800'
                  }`}
                >
                  {day}
                </button>
              );
            })}
          </div>
        </section>

        {selectedDay && (
          <section className="mt-6 px-4 animate-in fade-in slide-in-from-bottom-4">
            <h4 className="text-base font-semibold">Día {selectedDay} de {MONTH_NAMES[month]}</h4>
            <p className="text-xs text-gray-500 dark:text-gray-400 mb-4">Selecciona la hora para tu reserva</p>

            <div className="grid grid-cols-3 gap-2">
              {resolvedSlots.morning.enabled && (
                <button
                  onClick={() => setSelectedSlot('morning')}
                  className={`p-3 rounded-xl text-center border transition-all ${selectedSlot === 'morning' ? 'border-secondary bg-secondary/5' : 'border-slate-100 dark:border-slate-800'}`}
                >
                  <div className={`text-[10px] ${selectedSlot === 'morning' ? 'text-secondary font-medium' : 'text-slate-400'}`}>Mañana</div>
                  <div className={`text-xs font-bold mt-1 ${selectedSlot === 'morning' ? 'text-secondary' : ''}`}>{resolvedSlots.morning.label}</div>
                </button>
              )}
              {resolvedSlots.afternoon.enabled && (
                <button
                  onClick={() => setSelectedSlot('afternoon')}
                  className={`p-3 rounded-xl text-center border transition-all ${selectedSlot === 'afternoon' ? 'border-secondary bg-secondary/5' : 'border-slate-100 dark:border-slate-800'}`}
                >
                  <div className={`text-[10px] ${selectedSlot === 'afternoon' ? 'text-secondary font-medium' : 'text-slate-400'}`}>Tarde</div>
                  <div className={`text-xs font-bold mt-1 ${selectedSlot === 'afternoon' ? 'text-secondary' : ''}`}>{resolvedSlots.afternoon.label}</div>
                </button>
              )}
              {resolvedSlots.night.enabled && (
                <button
                  onClick={() => setSelectedSlot('night')}
                  className={`p-3 rounded-xl text-center border transition-all ${selectedSlot === 'night' ? 'border-secondary bg-secondary/5' : 'border-slate-100 dark:border-slate-800'}`}
                >
                  <div className={`text-[10px] ${selectedSlot === 'night' ? 'text-secondary font-medium' : 'text-slate-400'}`}>Noche</div>
                  <div className={`text-xs font-bold mt-1 ${selectedSlot === 'night' ? 'text-secondary' : ''}`}>{resolvedSlots.night.label}</div>
                </button>
              )}
            </div>
          </section>
        )}

        {selectedSlot && (
          <section className="mt-6 px-4 animate-in fade-in slide-in-from-bottom-4">
            <div className="bg-white dark:bg-surface-dark p-4 rounded-2xl border border-slate-100 dark:border-slate-800">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h4 className="text-sm font-bold">Horas extra</h4>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    Tu paquete incluye {usingFlexible ? venue.includedHours : slotHours}h. Este horario dura {slotHours}h{usingFlexible && slotHours > venue.includedHours ? ` (ya incluye ${slotHours - venue.includedHours}h extra)` : ''}. ${extraPrice.toLocaleString()}/h adicional.
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setExtraHours(Math.max(0, extraHours - 1))}
                    disabled={extraHours === 0}
                    className="w-9 h-9 rounded-full border border-slate-200 dark:border-slate-700 flex items-center justify-center disabled:opacity-40"
                    aria-label="Quitar hora extra"
                  >
                    <span className="material-icons-round text-[18px]">remove</span>
                  </button>
                  <span className="w-8 text-center font-bold">{extraHours}</span>
                  <button
                    type="button"
                    onClick={() => {
                      const maxLimit = venue?.maxExtraHours != null ? venue.maxExtraHours : 6;
                      setExtraHours(Math.min(maxLimit, extraHours + 1));
                    }}
                    disabled={extraHours >= (venue?.maxExtraHours != null ? venue.maxExtraHours : 6)}
                    className="w-9 h-9 rounded-full border border-slate-200 dark:border-slate-700 flex items-center justify-center disabled:opacity-40"
                    aria-label="Agregar hora extra"
                  >
                    <span className="material-icons-round text-[18px]">add</span>
                  </button>
                </div>
              </div>
              {extraHours > 0 && (
                <div className="flex justify-between text-xs text-slate-600 dark:text-slate-300 pt-3 border-t border-slate-100 dark:border-slate-800">
                  <span>{slotHours}h base + {extraHours}h extra = {slotHours + extraHours}h totales</span>
                  <span className="font-semibold">+${(extraPrice * extraHours).toLocaleString()}</span>
                </div>
              )}
            </div>
          </section>
        )}


        {selectedSlot && (
          <section className="mt-6 px-4 animate-in fade-in slide-in-from-bottom-4">
            <div className="bg-white dark:bg-surface-dark p-4 rounded-2xl border border-slate-100 dark:border-slate-800">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h4 className="text-sm font-bold">Número de invitados</h4>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    {usingFlexible
                      ? `Incluye ${venue.baseCapacity} personas. Persona extra: $${(venue.extraPersonPrice || 0).toLocaleString()}/persona/hora. Máx: ${venue.maxCapacity}.`
                      : 'Selecciona la cantidad de personas'}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setGuests(Math.max(1, guests - 1))}
                    disabled={guests <= 1}
                    className="w-9 h-9 rounded-full border border-slate-200 dark:border-slate-700 flex items-center justify-center disabled:opacity-40"
                    aria-label="Disminuir invitados"
                  >
                    <span className="material-icons-round text-[18px]">remove</span>
                  </button>
                  <input
                    ref={guestsRef}
                    type="number"
                    inputMode="numeric"
                    min={1}
                    max={venue.maxCapacity || 9999}
                    value={guests}
                    onChange={(e) => {
                      const raw = e.target.value;
                      if (raw === '') {
                        setGuests(0);
                        return;
                      }
                      const val = parseInt(raw, 10);
                      if (!Number.isNaN(val)) {
                        setGuests(Math.max(0, val));
                      }
                    }}
                    onBlur={(e) => {
                      const val = parseInt(e.target.value, 10);
                      const max = venue.maxCapacity || 9999;
                      if (Number.isNaN(val) || val < 1) setGuests(1);
                      else setGuests(Math.min(max, val));
                    }}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        const val = parseInt((e.target as HTMLInputElement).value, 10);
                        const max = venue.maxCapacity || 9999;
                        if (Number.isNaN(val) || val < 1) setGuests(1);
                        else setGuests(Math.min(max, val));
                        (e.target as HTMLInputElement).blur();
                      }
                    }}
                    className="w-20 text-center text-base font-bold bg-transparent border-b-2 border-primary/30 focus:border-primary focus:outline-none py-1 appearance-none"
                    aria-label="Número de invitados"
                  />
                  <button
                    type="button"
                    onClick={() => setGuests(Math.min(venue.maxCapacity || 9999, guests + 1))}
                    disabled={guests >= (venue.maxCapacity || 9999)}
                    className="w-9 h-9 rounded-full border border-slate-200 dark:border-slate-700 flex items-center justify-center disabled:opacity-40"
                    aria-label="Aumentar invitados"
                  >
                    <span className="material-icons-round text-[18px]">add</span>
                  </button>
                </div>
              </div>
              {flexibleBreakdown && flexibleBreakdown.extraPeople > 0 && (
                <div className="flex justify-between text-xs text-slate-600 dark:text-slate-300 pt-3 border-t border-slate-100 dark:border-slate-800">
                  <span>{flexibleBreakdown.extraPeople} personas extra × {slotHours + extraHours}h</span>
                  <span className="font-semibold">+${flexibleBreakdown.extraPeopleCost.toLocaleString()}</span>
                </div>
              )}
            </div>
          </section>
        )}

        <section className="mt-8 px-4 py-6 bg-slate-50 dark:bg-slate-900/40">
          <div className="bg-white dark:bg-surface-dark p-5 rounded-3xl shadow-sm space-y-4">
            <h4 className="text-sm font-bold uppercase tracking-wider text-slate-400">Desglose estimado</h4>
            {flexibleBreakdown ? (
              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-slate-600 dark:text-slate-300">Paquete base ({venue.baseCapacity} pers · {venue.includedHours}h)</span>
                  <span className="font-semibold">${flexibleBreakdown.basePrice.toLocaleString()}</span>
                </div>
                {flexibleBreakdown.extraPeopleCost > 0 && (
                  <div className="flex justify-between">
                    <span className="text-slate-600 dark:text-slate-300">Personas extra ({flexibleBreakdown.extraPeople})</span>
                    <span className="font-semibold">+${flexibleBreakdown.extraPeopleCost.toLocaleString()}</span>
                  </div>
                )}
                {flexibleBreakdown.extraHoursCost > 0 && (
                  <div className="flex justify-between">
                    <span className="text-slate-600 dark:text-slate-300">Horas extra ({flexibleBreakdown.extraHours})</span>
                    <span className="font-semibold">+${flexibleBreakdown.extraHoursCost.toLocaleString()}</span>
                  </div>
                )}
                <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex justify-between items-center">
                  <span className="font-bold text-sm">Total estimado</span>
                  <span className="font-bold text-lg text-primary">${flexibleBreakdown.total.toLocaleString()}</span>
                </div>
              </div>
            ) : (
              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-slate-600 dark:text-slate-300">Tarifa base</span>
                  <span className="font-semibold">${venue.price}/hora</span>
                </div>
                <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex justify-between items-center">
                  <span className="font-bold text-sm">Total estimado</span>
                  <span className="font-bold text-lg text-primary">${estimatedTotal.toLocaleString()}</span>
                </div>
              </div>
            )}
          </div>
        </section>
      </main>

      <footer className="fixed bottom-0 left-0 right-0 max-w-md mx-auto bg-white/95 dark:bg-surface-dark/95 backdrop-blur-md border-t border-slate-100 dark:border-slate-800 px-4 pt-3 pb-[calc(env(safe-area-inset-bottom,0px)+0.75rem)] flex items-center justify-between z-50">
        <div>
          <div className="text-[10px] text-gray-400 font-medium">Precio estimado</div>
          <div className="text-lg font-bold text-slate-900 dark:text-white">${estimatedTotal.toLocaleString()} MXN</div>
        </div>
        <button
          type="button"
          onClick={handleContinue}
          disabled={!selectedDay || !selectedSlot}
          className={`font-semibold px-8 py-3.5 rounded-2xl shadow-lg transition-transform ${
            selectedDay && selectedSlot
              ? 'bg-primary hover:bg-orange-600 text-white shadow-primary/20 active:scale-95'
              : 'bg-slate-200 dark:bg-slate-800 text-slate-400 cursor-not-allowed'
          }`}
        >
          Continuar
        </button>
      </footer>
    </div>
  );
};

export default BookingCalendar;
