
import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { getVenueById, getVenueServices, PublicVenueService } from '../../src/services/venueService';
import { useUser } from '../../context/UserContext';
import { Venue } from '../../types';
import { getAmenity } from '../../src/constants/amenities';
import { parsePolicy, describePolicy, shortPolicyLabel } from '../../src/utils/cancellation';
import { shareVenue } from '../../src/utils/shareVenue';
import { toast } from 'sonner';

const VenueDetail: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const { isFavorite, toggleFavorite } = useUser();
  const [isSummaryExpanded, setIsSummaryExpanded] = useState(false);
  const [venue, setVenue] = useState<Venue | null>(null);
  const [loading, setLoading] = useState(true);
  const [extras, setExtras] = useState<PublicVenueService[]>([]);
  const [selectedExtras, setSelectedExtras] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    getVenueById(id).then((v) => {
      setVenue(v);
      setLoading(false);
    });
    getVenueServices(id).then(setExtras).catch(() => setExtras([]));
  }, [id]);

  const toggleExtra = (sid: string) => {
    setSelectedExtras(prev => {
      const next = new Set(prev);
      if (next.has(sid)) next.delete(sid); else next.add(sid);
      return next;
    });
  };

  const goToBooking = () => {
    if (!venue) return;
    const ids = Array.from(selectedExtras);
    const qs = ids.length ? `?services=${ids.join(',')}` : '';
    navigate(`/user/booking/${venue.id}${qs}`);
  };

  const extrasTotal = extras
    .filter(e => selectedExtras.has(e.id))
    .reduce((sum, e) => sum + e.price, 0);


  const handleShare = async () => {
    if (!venue) return;
    try {
      const result = await shareVenue(venue.id, venue.name);
      if (result === 'copied') toast.success('Enlace del espacio copiado');
    } catch (error) {
      console.error('Error al compartir espacio:', error);
      toast.error('No se pudo compartir el espacio. Inténtalo de nuevo.');
    }
  };

  if (loading) {
    return (
      <div className="bg-white dark:bg-background-dark min-h-screen max-w-md mx-auto flex items-center justify-center">
        <span className="material-icons-outlined animate-spin text-primary text-3xl">refresh</span>
      </div>
    );
  }

  if (!venue) {
    return (
      <div className="bg-white dark:bg-background-dark min-h-screen max-w-md mx-auto flex flex-col items-center justify-center p-6 text-center gap-4">
        <span className="material-icons-outlined text-slate-300 text-6xl">search_off</span>
        <h2 className="text-lg font-bold dark:text-white">Espacio no encontrado</h2>
        <p className="text-sm text-slate-500">Es posible que ya no esté disponible.</p>
        <button onClick={() => navigate('/user/home')} className="bg-primary text-white px-6 py-3 rounded-xl font-bold">Volver al inicio</button>
      </div>
    );
  }

  const address = venue.location;
  const embedUrl = `https://maps.google.com/maps?q=${encodeURIComponent(address)}&t=&z=15&ie=UTF8&iwloc=&output=embed`;
  const directionsUrl = `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(address)}`;
  const handleBack = () => {
    if (window.history.length > 1) {
      navigate(-1);
    } else {
      navigate('/user/home');
    }
  };
  const fav = isFavorite(venue.id);

  return (
    <div className="bg-white dark:bg-background-dark text-slate-800 dark:text-slate-100 antialiased max-w-md mx-auto min-h-screen">
      <div className="fixed top-0 left-0 right-0 z-50 flex justify-between items-center px-4 pt-[calc(env(safe-area-inset-top,0px)+0.75rem)] pb-2 max-w-md mx-auto pointer-events-none">
        <button
          type="button"
          onClick={handleBack}
          aria-label="Volver"
          className="w-11 h-11 flex items-center justify-center bg-white/95 dark:bg-slate-800/95 text-slate-800 dark:text-white rounded-full shadow-lg backdrop-blur-md active:scale-90 transition-transform pointer-events-auto"
        >
          <span className="material-icons-round text-2xl">chevron_left</span>
        </button>
        <div className="flex gap-2 pointer-events-auto">
          <button
            type="button"
            onClick={handleShare}
            aria-label="Compartir espacio"
            title="Compartir espacio"
            className="w-10 h-10 flex items-center justify-center bg-white/90 dark:bg-slate-800/90 rounded-full shadow-lg backdrop-blur-sm hover:text-primary active:scale-90 transition-all"
          >
            <span className="material-icons-outlined text-[20px]">share</span>
          </button>
          <button
            onClick={() => toggleFavorite(venue.id)}
            aria-label={fav ? 'Quitar de favoritos' : 'Añadir a favoritos'}
            className="w-10 h-10 flex items-center justify-center bg-white/90 dark:bg-slate-800/90 rounded-full shadow-lg backdrop-blur-sm active:scale-90 transition-all"
          >
            <span className="material-icons-outlined text-primary text-[20px]">{fav ? 'favorite' : 'favorite_border'}</span>
          </button>
        </div>
      </div>

      <main className="pb-36">
        <div className="relative w-full h-[320px] bg-slate-200 overflow-hidden">
          <img alt={venue.name} className="w-full h-full object-cover" src={venue.image} loading="lazy"/>
        </div>

        <div className="px-5 pt-6 space-y-6">
          <div className="bg-orange-50/50 dark:bg-orange-900/10 rounded-3xl border border-orange-100/50 dark:border-orange-800/30 overflow-hidden transition-all duration-300 shadow-sm">
            <button onClick={() => setIsSummaryExpanded(!isSummaryExpanded)} className="w-full flex items-center justify-between p-4 focus:outline-none">
              <div className="flex items-center gap-4 text-left">
                <div className="bg-primary text-white w-12 h-12 rounded-2xl flex items-center justify-center shadow-md shadow-primary/20">
                  <span className="material-icons-round">event_available</span>
                </div>
                <div>
                  <p className="text-[10px] font-bold text-primary uppercase tracking-[0.15em] mb-1">Precio desde</p>
                  <p className="text-[15px] font-bold text-slate-800 dark:text-white leading-tight">${venue.price.toLocaleString()} / hora</p>
                  <p className="text-[11px] font-medium text-slate-500 dark:text-slate-400">
                    Mínimo {venue.minHours ?? 4}h · desde ${((venue.minHours ?? 4) * venue.price).toLocaleString()} · horas extra ${(venue.extraHourPrice ?? venue.price).toLocaleString()}/h
                  </p>
                </div>
              </div>
              <div className="bg-white dark:bg-slate-800 w-8 h-8 rounded-full flex items-center justify-center shadow-sm border border-slate-100 dark:border-slate-700">
                <span className={`material-icons-round text-slate-400 transition-transform duration-500 ${isSummaryExpanded ? 'rotate-180' : ''}`}>expand_more</span>
              </div>
            </button>

            <div className={`transition-all duration-500 ease-in-out overflow-hidden ${isSummaryExpanded ? 'max-h-[400px] opacity-100' : 'max-h-0 opacity-0'}`}>
              <div className="px-5 pb-6 pt-2 space-y-4 border-t border-orange-100/50 dark:border-orange-800/20">
                <button
                  onClick={goToBooking}
                  className="w-full py-3 bg-primary text-white text-sm font-bold rounded-xl shadow-lg shadow-primary/20"
                >
                  Elegir fecha y horario
                </button>

              </div>
            </div>
          </div>

          <section>
            <div className="flex justify-between items-start">
              <h1 className="text-2xl font-bold dark:text-white font-display">{venue.name}</h1>
              <div className="flex items-center gap-1 mt-1">
                <span className="material-icons-outlined text-yellow-400 text-[18px]">star</span>
                <span className="font-bold">{venue.rating}</span>
                <span className="text-slate-500 dark:text-slate-400 text-sm">({venue.reviewsCount})</span>
              </div>
            </div>
            <div className="flex items-center gap-1 text-slate-500 dark:text-slate-400 mt-1">
              <span className="material-icons-outlined text-primary text-[18px]">location_on</span>
              <span className="text-sm">{venue.location}</span>
            </div>
            <div className="flex gap-6 mt-4">
              <div className="flex items-center gap-2">
                <span className="material-icons-outlined text-secondary">groups</span>
                <span className="text-sm font-medium">Hasta {venue.capacity} personas</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="material-icons-outlined text-secondary">straighten</span>
                <span className="text-sm font-medium">{venue.size} m²</span>
              </div>
            </div>
          </section>

          <hr className="border-slate-100 dark:border-slate-800"/>

          <section>
            <h2 className="text-lg font-bold mb-2 font-display">Descripción</h2>
            <p className="text-slate-600 dark:text-slate-400 leading-relaxed text-[15px]">
              {venue.name} es un espacio elegante ideal para eventos corporativos, bodas y celebraciones especiales. El lugar cuenta con instalaciones modernas que proporcionan comodidad y estilo para todos tus invitados.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold mb-4 font-display">Servicios incluidos</h2>
            {venue.amenities && venue.amenities.length > 0 ? (
              <div className="grid grid-cols-2 gap-2">
                {venue.amenities.map((key) => {
                  const a = getAmenity(key);
                  return (
                    <div
                      key={key}
                      className="flex items-center gap-2 px-3 py-2.5 bg-slate-50 dark:bg-slate-800/60 rounded-xl"
                    >
                      <span className="material-icons-outlined text-secondary text-[20px]">{a.icon}</span>
                      <span className="text-[13px] font-medium text-slate-700 dark:text-slate-200 truncate">{a.label}</span>
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="text-sm text-slate-400">El anfitrión no ha especificado servicios incluidos.</p>
            )}
          </section>

          <hr className="border-slate-100 dark:border-slate-800"/>

          <section>
            <div className="flex items-center gap-2 mb-3">
              <h2 className="text-lg font-bold font-display">Política de cancelación</h2>
              <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                {shortPolicyLabel(parsePolicy(venue.cancellationType, venue.cancellationDays, venue.cancellationTiers))}
              </span>
            </div>
            <ul className="space-y-2">
              {describePolicy(parsePolicy(venue.cancellationType, venue.cancellationDays, venue.cancellationTiers)).map((line, i) => (
                <li key={i} className="flex gap-2 text-[13px] text-slate-600 dark:text-slate-300 leading-snug">
                  <span className="material-icons-outlined text-secondary text-[18px] shrink-0">event_busy</span>
                  <span>{line}</span>
                </li>
              ))}
            </ul>
          </section>

          {extras.length > 0 && (
            <>
              <hr className="border-slate-100 dark:border-slate-800"/>
              <section>
                <div className="flex items-baseline justify-between mb-4">
                  <h2 className="text-lg font-bold font-display">Servicios opcionales</h2>
                  <span className="text-[11px] text-slate-400 font-bold uppercase tracking-widest">Selecciona</span>
                </div>
                <div className="space-y-3">
                  {extras.map((s) => {
                    const checked = selectedExtras.has(s.id);
                    return (
                      <button
                        key={s.id}
                        onClick={() => toggleExtra(s.id)}
                        className={`w-full text-left p-4 rounded-2xl border-2 transition-all ${
                          checked
                            ? 'border-primary bg-primary/5'
                            : 'border-slate-100 dark:border-slate-800 bg-white dark:bg-surface-dark'
                        }`}
                      >
                        <div className="flex items-center justify-between gap-3">
                          <div className="flex items-center gap-3 min-w-0">
                            <div className={`w-6 h-6 rounded-md flex-shrink-0 flex items-center justify-center border-2 ${
                              checked ? 'bg-primary border-primary text-white' : 'border-slate-300 dark:border-slate-600'
                            }`}>
                              {checked && <span className="material-icons-outlined text-[16px]">check</span>}
                            </div>
                            <div className="min-w-0">
                              <p className="font-bold text-sm dark:text-white truncate">{s.name}</p>
                              {s.description && (
                                <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-snug line-clamp-2">{s.description}</p>
                              )}
                            </div>
                          </div>
                          <span className="font-bold text-primary text-sm flex-shrink-0">+${s.price.toLocaleString()}</span>
                        </div>
                      </button>
                    );
                  })}
                </div>
                {extrasTotal > 0 && (
                  <div className="mt-4 flex justify-between items-center bg-orange-50 dark:bg-orange-900/10 px-4 py-3 rounded-xl border border-orange-100 dark:border-orange-800/30">
                    <span className="text-xs font-bold text-primary uppercase tracking-widest">Extras seleccionados</span>
                    <span className="font-bold text-primary">+${extrasTotal.toLocaleString()} MXN</span>
                  </div>
                )}
              </section>
            </>
          )}

          <hr className="border-slate-100 dark:border-slate-800"/>


          <section>
            <h2 className="text-lg font-bold mb-4 font-display">Ubicación</h2>
            <div className="relative w-full h-56 rounded-2xl overflow-hidden mb-4 shadow-inner border border-slate-100 dark:border-slate-800">
              <iframe title="Location Map" width="100%" height="100%" frameBorder="0" style={{ border: 0 }} src={embedUrl} allowFullScreen></iframe>
            </div>
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-full bg-orange-50 dark:bg-orange-900/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="material-icons-outlined text-primary">location_on</span>
                </div>
                <p className="text-[14px] text-slate-600 dark:text-slate-400 leading-snug">{address}</p>
              </div>
              <a href={directionsUrl} target="_blank" rel="noopener noreferrer" className="w-full flex items-center justify-center gap-2 py-3.5 bg-secondary/10 dark:bg-secondary/20 text-secondary font-bold rounded-xl hover:bg-secondary hover:text-white transition-all duration-300">
                <span className="material-icons-outlined text-xl">directions</span>
                Obtener indicaciones
              </a>
            </div>
          </section>
        </div>
      </main>

      <div className="fixed bottom-0 left-0 right-0 px-4 pt-3 pb-[calc(env(safe-area-inset-bottom,0px)+0.75rem)] bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border-t border-slate-100 dark:border-slate-800 z-50 max-w-md mx-auto">
        <div className="flex justify-between items-center gap-3">
          <div className="min-w-0">
            <span className="text-xs text-slate-400 uppercase font-bold tracking-wider">Precio base</span>
            <div className="text-xl font-bold text-slate-800 dark:text-white truncate">${venue.price.toLocaleString()} MXN</div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => navigate('/user/messages', { state: { openVenueId: venue.id } })}
              aria-label="Contactar anfitrión"
              className="w-12 h-12 flex items-center justify-center bg-secondary/10 text-secondary rounded-2xl hover:bg-secondary hover:text-white transition-all active:scale-95"
            >
              <span className="material-icons-outlined">chat_bubble_outline</span>
            </button>
            <button
              onClick={goToBooking}
              className="bg-primary hover:bg-orange-600 text-white font-bold px-6 py-4 rounded-2xl shadow-lg shadow-primary/20 transition-all active:scale-[0.98]"
            >
              Reservar
            </button>

          </div>
        </div>
      </div>
    </div>
  );
};

export default VenueDetail;
