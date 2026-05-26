
import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { getVenueById } from '../../src/services/venueService';
import { useUser } from '../../context/UserContext';
import { Venue } from '../../types';

const VenueDetail: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const { isFavorite, toggleFavorite } = useUser();
  const [isSummaryExpanded, setIsSummaryExpanded] = useState(false);
  const [venue, setVenue] = useState<Venue | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    getVenueById(id).then((v) => {
      setVenue(v);
      setLoading(false);
    });
  }, [id]);

  const handleShare = async () => {
    if (!venue) return;
    if (navigator.share) {
      try {
        await navigator.share({
          title: venue.name,
          text: `¡Mira este increíble lugar para eventos en LUGARE: ${venue.name}!`,
          url: window.location.href,
        });
      } catch (err) {
        console.log('Error al compartir:', err);
      }
    } else {
      alert('Enlace copiado al portapapeles');
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
  const fav = isFavorite(venue.id);

  return (
    <div className="bg-white dark:bg-background-dark text-slate-800 dark:text-slate-100 antialiased max-w-md mx-auto min-h-screen">
      <div className="fixed top-0 left-0 right-0 z-50 flex justify-between items-center p-4 max-w-md mx-auto">
        <button
          onClick={() => navigate(-1)}
          className="w-10 h-10 flex items-center justify-center bg-white/90 dark:bg-slate-800/90 rounded-full shadow-lg backdrop-blur-sm active:scale-90 transition-transform"
        >
          <span className="material-icons-outlined text-slate-800 dark:text-white">chevron_left</span>
        </button>
        <div className="flex gap-2">
          <button
            onClick={handleShare}
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

      <main className="pb-32">
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
                  <p className="text-[11px] font-medium text-slate-500 dark:text-slate-400">Selecciona fecha para ver total</p>
                </div>
              </div>
              <div className="bg-white dark:bg-slate-800 w-8 h-8 rounded-full flex items-center justify-center shadow-sm border border-slate-100 dark:border-slate-700">
                <span className={`material-icons-round text-slate-400 transition-transform duration-500 ${isSummaryExpanded ? 'rotate-180' : ''}`}>expand_more</span>
              </div>
            </button>

            <div className={`transition-all duration-500 ease-in-out overflow-hidden ${isSummaryExpanded ? 'max-h-[400px] opacity-100' : 'max-h-0 opacity-0'}`}>
              <div className="px-5 pb-6 pt-2 space-y-4 border-t border-orange-100/50 dark:border-orange-800/20">
                <button
                  onClick={() => navigate(`/user/booking/${venue.id}`)}
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
            <div className="flex flex-wrap gap-2">
              {['WiFi', 'Aire acondicionado', 'Equipo de sonido', 'Catering', 'Estacionamiento'].map((svc, i) => (
                <span key={i} className="inline-flex items-center gap-1.5 px-3 py-2 bg-slate-100 dark:bg-slate-800 rounded-full text-sm">
                  <span className="material-icons-outlined text-secondary text-[18px]">check_circle</span> {svc}
                </span>
              ))}
            </div>
          </section>

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

      <div className="fixed bottom-0 left-0 right-0 p-4 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-t border-slate-100 dark:border-slate-800 z-50 max-w-md mx-auto">
        <div className="flex justify-between items-center">
          <div>
            <span className="text-xs text-slate-400 uppercase font-bold tracking-wider">Precio base</span>
            <div className="text-xl font-bold text-slate-800 dark:text-white">${venue.price.toLocaleString()} MXN</div>
          </div>
          <button
            onClick={() => navigate(`/user/booking/${venue.id}`)}
            className="bg-primary hover:bg-orange-600 text-white font-bold px-8 py-4 rounded-2xl shadow-lg shadow-primary/20 transition-all active:scale-[0.98]"
          >
            Reservar ahora
          </button>
        </div>
      </div>
    </div>
  );
};

export default VenueDetail;
