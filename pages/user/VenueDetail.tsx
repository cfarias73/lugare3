
import React, { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { MOCK_VENUES } from '../../constants';

const VenueDetail: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const [isSummaryExpanded, setIsSummaryExpanded] = useState(false);

  const venue = MOCK_VENUES.find(v => v.id === id) || MOCK_VENUES[0];

  // Address for the venue
  const address = venue.location;
  const embedUrl = `https://maps.google.com/maps?q=${encodeURIComponent(address)}&t=&z=15&ie=UTF8&iwloc=&output=embed`;
  const directionsUrl = `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(address)}`;

  const handleShare = async () => {
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
          <button className="w-10 h-10 flex items-center justify-center bg-white/90 dark:bg-slate-800/90 rounded-full shadow-lg backdrop-blur-sm hover:text-red-500 active:scale-90 transition-all">
            <span className="material-icons-outlined text-primary text-[20px]">favorite_border</span>
          </button>
        </div>
      </div>

      <main className="pb-32">
        {/* Main Image Gallery */}
        <div className="relative w-full h-[320px] bg-slate-200 overflow-hidden">
          <img 
            alt={venue.name} 
            className="w-full h-full object-cover" 
            src={venue.image} 
            loading="lazy"
          />
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-1.5">
            <div className="w-2 h-2 rounded-full bg-primary"></div>
            <div className="w-2 h-2 rounded-full bg-white/50"></div>
            <div className="w-2 h-2 rounded-full bg-white/50"></div>
            <div className="w-2 h-2 rounded-full bg-white/50"></div>
          </div>
        </div>

        <div className="px-5 pt-6 space-y-6">
          {/* Collapsible Booking Summary Section */}
          <div className="bg-orange-50/50 dark:bg-orange-900/10 rounded-3xl border border-orange-100/50 dark:border-orange-800/30 overflow-hidden transition-all duration-300 shadow-sm">
            <button 
              onClick={() => setIsSummaryExpanded(!isSummaryExpanded)}
              className="w-full flex items-center justify-between p-4 focus:outline-none"
            >
              <div className="flex items-center gap-4 text-left">
                <div className="bg-primary text-white w-12 h-12 rounded-2xl flex items-center justify-center shadow-md shadow-primary/20">
                  <span className="material-icons-round">event_available</span>
                </div>
                <div>
                  <p className="text-[10px] font-bold text-primary uppercase tracking-[0.15em] mb-1">Resumen de Reserva</p>
                  <p className="text-[15px] font-bold text-slate-800 dark:text-white leading-tight">12 Ago • 19:00 - 00:00</p>
                  <p className="text-[11px] font-medium text-slate-500 dark:text-slate-400">Total: ${venue.price.toLocaleString()} MXN</p>
                </div>
              </div>
              <div className="bg-white dark:bg-slate-800 w-8 h-8 rounded-full flex items-center justify-center shadow-sm border border-slate-100 dark:border-slate-700">
                <span className={`material-icons-round text-slate-400 transition-transform duration-500 ${isSummaryExpanded ? 'rotate-180' : ''}`}>
                  expand_more
                </span>
              </div>
            </button>
            
            <div className={`transition-all duration-500 ease-in-out overflow-hidden ${isSummaryExpanded ? 'max-h-[400px] opacity-100' : 'max-h-0 opacity-0'}`}>
              <div className="px-5 pb-6 pt-2 space-y-4 border-t border-orange-100/50 dark:border-orange-800/20">
                <div className="grid grid-cols-2 gap-4 mt-2">
                  <div className="space-y-1">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Fecha</p>
                    <p className="text-sm font-semibold dark:text-slate-200">Martes, 12 Ago</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Horario</p>
                    <p className="text-sm font-semibold dark:text-slate-200">19:00 - 00:00</p>
                  </div>
                </div>

                <div className="bg-white dark:bg-slate-800/60 rounded-2xl p-4 space-y-2.5 border border-orange-100/30 dark:border-slate-700">
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-slate-500">Renta del espacio (5h)</span>
                    <span className="font-bold">${(venue.price - 1000).toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-slate-500">Tarifa de servicio</span>
                    <span className="font-bold">$1,000</span>
                  </div>
                  <div className="pt-2.5 mt-2.5 border-t border-slate-100 dark:border-slate-700 flex justify-between items-center">
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-800 dark:text-white">Total estimado</span>
                    <span className="text-lg font-bold text-primary">${venue.price.toLocaleString()}</span>
                  </div>
                </div>

                <div className="flex gap-3 pt-2">
                  <button 
                    onClick={() => navigate(`/user/booking/${id}`)}
                    className="flex-1 py-3 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 text-xs font-bold rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-50 transition-colors flex items-center justify-center gap-2"
                  >
                    <span className="material-icons-round text-sm text-primary">edit</span>
                    Modificar
                  </button>
                  <button 
                    onClick={() => navigate(`/user/checkout/${id}`)}
                    className="flex-1 py-3 bg-primary text-white text-xs font-bold rounded-xl shadow-lg shadow-primary/20 hover:bg-orange-600 transition-colors"
                  >
                    Continuar
                  </button>
                </div>
              </div>
            </div>
          </div>

          <div className="flex gap-2 overflow-x-auto no-scrollbar">
            {[venue.image, venue.image, venue.image].map((img, i) => (
              <img key={i} alt="Preview" className="w-20 h-20 rounded-lg object-cover flex-shrink-0 shadow-sm" src={img} loading="lazy" />
            ))}
            <div className="w-20 h-20 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center flex-shrink-0 text-slate-500 font-bold border border-slate-200 dark:border-slate-700">
              +8
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
            <button className="mt-2 text-primary font-semibold flex items-center text-sm">
              Leer más <span className="material-icons-outlined text-[16px] ml-0.5">expand_more</span>
            </button>
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

          {/* Location Map Section */}
          <section>
            <h2 className="text-lg font-bold mb-4 font-display">Ubicación</h2>
            <div className="relative w-full h-56 rounded-2xl overflow-hidden mb-4 shadow-inner border border-slate-100 dark:border-slate-800">
              <iframe
                title="Location Map"
                width="100%"
                height="100%"
                frameBorder="0"
                style={{ border: 0 }}
                src={embedUrl}
                allowFullScreen
              ></iframe>
            </div>
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-full bg-orange-50 dark:bg-orange-900/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="material-icons-outlined text-primary">location_on</span>
                </div>
                <p className="text-[14px] text-slate-600 dark:text-slate-400 leading-snug">
                  {address}
                </p>
              </div>
              <a 
                href={directionsUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full flex items-center justify-center gap-2 py-3.5 bg-secondary/10 dark:bg-secondary/20 text-secondary font-bold rounded-xl hover:bg-secondary hover:text-white transition-all duration-300"
              >
                <span className="material-icons-outlined text-xl">directions</span>
                Obtener indicaciones
              </a>
            </div>
          </section>
        </div>
      </main>

      {/* Persistent CTA */}
      <div className="fixed bottom-0 left-0 right-0 p-4 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-t border-slate-100 dark:border-slate-800 z-50 max-w-md mx-auto">
        <div className="flex justify-between items-center mb-4">
          <div>
            <span className="text-xs text-slate-400 uppercase font-bold tracking-wider">Precio base</span>
            <div className="text-xl font-bold text-slate-800 dark:text-white">${venue.price.toLocaleString()} MXN</div>
          </div>
          <button 
            onClick={() => navigate(`/user/booking/${id}`)}
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
