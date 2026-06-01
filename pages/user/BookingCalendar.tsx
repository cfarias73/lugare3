
import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { MOCK_VENUES } from '../../constants';
import { supabase } from '../../lib/supabaseClient';

const SLOT_TIMES = {
  morning: { start: '08:00:00', end: '13:00:00', hours: 5 },
  afternoon: { start: '14:00:00', end: '19:00:00', hours: 5 },
  night: { start: '20:00:00', end: '02:00:00', hours: 6 },
} as const;

const BookingCalendar: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const [selectedDay, setSelectedDay] = useState<number | null>(null);
  const [selectedSlot, setSelectedSlot] = useState<'morning' | 'afternoon' | 'night' | null>(null);
  const [extraHours, setExtraHours] = useState<number>(0);
  const [venue, setVenue] = useState<any>(MOCK_VENUES[0]);

  useEffect(() => {
    if (!id) return;
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);
    if (!isUuid) {
      const mock = MOCK_VENUES.find(v => v.id === id);
      if (mock) setVenue(mock);
      return;
    }
    supabase
      .from('venues')
      .select('*, venue_images(image_url)')
      .eq('id', id)
      .single()
      .then(({ data }) => {
        if (data) {
          setVenue({
            id: data.id,
            name: data.name,
            location: data.location || data.city,
            image: data.venue_images?.[0]?.image_url || MOCK_VENUES[0].image,
            price: Number(data.price_per_hour) || 0,
            rating: data.rating || 0,
            reviewsCount: data.reviews_count || 0,
            extraHourPrice: data.extra_hour_price != null ? Number(data.extra_hour_price) : Number(data.price_per_hour) || 0,
          });
        }
      });
  }, [id]);

  const days = Array.from({ length: 31 }, (_, i) => i + 1);

  // Simulate unavailable days (e.g., weekends or random days)
  const unavailableDays = [5, 12, 19, 26, 15, 16];

  const handleContinue = () => {
    if (selectedDay && selectedSlot) {
      const slot = SLOT_TIMES[selectedSlot];
      const date = `2025-10-${String(selectedDay).padStart(2, '0')}`;
      const params = new URLSearchParams({
        date,
        start: slot.start,
        end: slot.end,
        hours: String(slot.hours),
        guests: '10',
      });
      navigate(`/user/checkout/${id}?${params.toString()}`);
    } else {
      alert('Por favor selecciona un día y un horario.');
    }
  };

  return (
    <div className="bg-background-light dark:bg-background-dark text-slate-800 dark:text-slate-100 min-h-screen max-w-md mx-auto flex flex-col transition-colors">
      <header className="sticky top-0 z-50 bg-white dark:bg-background-dark border-b border-gray-100 dark:border-gray-800 px-4 py-4 flex items-center">
        <button onClick={() => navigate(-1)} className="p-2 -ml-2">
          <span className="material-icons-round align-middle">arrow_back_ios_new</span>
        </button>
        <h1 className="text-lg font-semibold ml-2 font-display">Calendario de Disponibilidad</h1>
      </header>

      <main className="pb-32 flex-1 overflow-y-auto">
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
            <button className="p-1"><span className="material-icons-round">chevron_left</span></button>
            <h3 className="font-semibold text-base">Octubre 2025</h3>
            <button className="p-1"><span className="material-icons-round">chevron_right</span></button>
          </div>
          <div className="grid grid-cols-7 text-center text-xs font-medium text-gray-400 dark:text-gray-500 mb-2">
            <div>L</div><div>M</div><div>X</div><div>J</div><div>V</div><div>S</div><div>D</div>
          </div>
          <div className="grid grid-cols-7 gap-1 text-sm">
            {/* Empty placeholders for calendar start day offset */}
            <div className="h-10"></div><div className="h-10"></div>
            {days.map((day) => {
              const isUnavailable = unavailableDays.includes(day);
              return (
                <button 
                  key={day}
                  onClick={() => !isUnavailable && setSelectedDay(day)}
                  disabled={isUnavailable}
                  className={`h-10 flex items-center justify-center rounded-lg transition-all ${
                    isUnavailable 
                      ? 'text-slate-300 dark:text-slate-600 cursor-not-allowed line-through' 
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
            <h4 className="text-base font-semibold">Día {selectedDay} de Octubre</h4>
            <p className="text-xs text-gray-500 dark:text-gray-400 mb-4">Selecciona la hora para tu reserva</p>
            
            <div className="grid grid-cols-3 gap-2">
              <button 
                onClick={() => setSelectedSlot('morning')}
                className={`p-3 rounded-xl text-center border transition-all ${selectedSlot === 'morning' ? 'border-secondary bg-secondary/5' : 'border-slate-100 dark:border-slate-800'}`}
              >
                <div className={`text-[10px] ${selectedSlot === 'morning' ? 'text-secondary font-medium' : 'text-slate-400'}`}>Mañana</div>
                <div className={`text-xs font-bold mt-1 ${selectedSlot === 'morning' ? 'text-secondary' : ''}`}>8:00 - 13:00</div>
              </button>
              <button 
                onClick={() => setSelectedSlot('afternoon')}
                className={`p-3 rounded-xl text-center border transition-all ${selectedSlot === 'afternoon' ? 'border-secondary bg-secondary/5' : 'border-slate-100 dark:border-slate-800'}`}
              >
                <div className={`text-[10px] ${selectedSlot === 'afternoon' ? 'text-secondary font-medium' : 'text-slate-400'}`}>Tarde</div>
                <div className={`text-xs font-bold mt-1 ${selectedSlot === 'afternoon' ? 'text-secondary' : ''}`}>14:00 - 19:00</div>
              </button>
              <button 
                onClick={() => setSelectedSlot('night')}
                className={`p-3 rounded-xl text-center border transition-all ${selectedSlot === 'night' ? 'border-secondary bg-secondary/5' : 'border-slate-100 dark:border-slate-800'}`}
              >
                <div className={`text-[10px] ${selectedSlot === 'night' ? 'text-secondary font-medium' : 'text-slate-400'}`}>Noche</div>
                <div className={`text-xs font-bold mt-1 ${selectedSlot === 'night' ? 'text-secondary' : ''}`}>20:00 - 2:00</div>
              </button>
            </div>
          </section>
        )}

        <section className="mt-8 px-4 py-6 bg-slate-50 dark:bg-slate-900/40">
          <div className="bg-white dark:bg-surface-dark p-5 rounded-3xl shadow-sm space-y-4">
            <h4 className="text-sm font-bold uppercase tracking-wider text-slate-400">Tarifas dinámicas</h4>
            <div className="space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-slate-600 dark:text-slate-300">Tarifa base</span>
                <span className="font-semibold">${venue.price}/hora</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-600 dark:text-slate-300">Impuestos</span>
                <span className="font-semibold">${Math.round(venue.price * 0.16)}</span>
              </div>
              <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex justify-between items-center">
                <span className="font-bold text-sm">Total por hora</span>
                <span className="font-bold text-lg text-primary">${venue.price + Math.round(venue.price * 0.16)}</span>
              </div>
            </div>
          </div>
        </section>
      </main>

      <footer className="fixed bottom-0 left-0 right-0 max-w-md mx-auto bg-white dark:bg-surface-dark border-t border-slate-100 dark:border-slate-800 p-4 pb-8 flex items-center justify-between z-50">
        <div>
          <div className="text-[10px] text-gray-400">Precio estimado</div>
          <div className="text-lg font-bold text-slate-900 dark:text-white">${venue.price * 5} MXN</div>
        </div>
        <button 
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
