
import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { supabase } from '../../lib/supabaseClient';

interface RateState {
  venueId?: string;
  venueName?: string;
  image?: string;
  date?: string;
  time?: string;
}

const DEFAULT_IMAGE = 'https://images.unsplash.com/photo-1519167758481-83f5e181dcc3?auto=format&fit=crop&q=80&w=400';

const RateExperience: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const state = (location.state as RateState | null) || {};
  const venueId = state.venueId || null;
  const venueName = state.venueName || 'Tu reserva';
  const venueImage = state.image || DEFAULT_IMAGE;
  const venueDate = state.date || '';
  const venueTime = state.time || '';

  const [mainRating, setMainRating] = useState(4);
  const [comment, setComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [aspectRatings, setAspectRatings] = useState({
    Limpieza: 5,
    Ubicación: 4,
    'Atención del anfitrión': 4,
    'Calidad/Precio': 3,
    Instalaciones: 5
  });

  const handleAspectRating = (aspect: string, rating: number) => {
    setAspectRatings(prev => ({ ...prev, [aspect]: rating }));
  };

  const handleSubmit = async () => {
    if (!venueId) {
      alert('Selecciona una reserva desde "Pasadas" en Reservas para valorarla.');
      navigate('/user/bookings');
      return;
    }
    setIsSubmitting(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        alert('Debes iniciar sesión para publicar una reseña.');
        navigate('/user/login');
        return;
      }
      const { error } = await supabase.from('reviews').insert({
        user_id: user.id,
        venue_id: venueId,
        rating: mainRating,
        comment: comment || null,
      });
      if (error) throw error;
      alert('¡Gracias por tu reseña!');
      navigate('/user/bookings');
    } catch (e: any) {
      console.error(e);
      alert(`No se pudo guardar la reseña: ${e?.message || 'error desconocido'}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const getRatingText = (rating: number) => {
    switch(rating) {
      case 1: return 'Malo';
      case 2: return 'Regular';
      case 3: return 'Bueno';
      case 4: return '¡Muy bueno!';
      case 5: return '¡Excelente!';
      default: return '';
    }
  };

  return (
    <div className="bg-background-light dark:bg-background-dark text-slate-800 dark:text-slate-100 min-h-screen flex flex-col max-w-md mx-auto">
      <header className="sticky top-0 z-50 bg-background-light dark:bg-background-dark border-b border-gray-200 dark:border-gray-800 px-4 py-4 flex items-center">
        <button 
          onClick={() => navigate(-1)}
          className="p-1 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors"
        >
          <span className="material-icons text-slate-700 dark:text-slate-300">arrow_back</span>
        </button>
        <h1 className="flex-1 text-center text-lg font-semibold text-slate-800 dark:text-white mr-8">Valorar experiencia</h1>
      </header>

      <main className="flex-1 overflow-y-auto px-5 py-4 space-y-6 pb-32">
        <div className="p-4 border border-gray-100 dark:border-gray-800 rounded-2xl bg-white dark:bg-surface-dark shadow-sm flex items-center gap-4">
          <img alt="Venue" className="w-20 h-20 rounded-xl object-cover shadow-sm" src="https://lh3.googleusercontent.com/aida-public/AB6AXuBlb4r72VIvNk5AkKrZaDvYibUqqXBMwVArIHuEiK7TCkdai7FWPOpyixgjlVQzikI06LtdXFoWgR0tUO7IA2ogNuMSKKRz1K2bhRRP_Y4QcUFbRvu_yVBvN0WWeGkFCeKA_3el9C584p4cjYyCZvDpYt5IUj204ZYofPEun34KG-Sxf-l0a9DGNZlxzYYKReVhpq1z1G3-MUM9R-E6NorSuZPCVd5np4JpR-wyAud_34hf3ZinZy3k-dcHesCZXt8Ucg1OeMLUZjO2"/>
          <div className="flex-1">
            <h2 className="text-lg font-semibold text-slate-800 dark:text-white leading-tight">Casa Loma</h2>
            <p className="text-sm text-slate-500 dark:text-slate-400">Salón para eventos</p>
            <p className="text-[12px] text-slate-400 dark:text-slate-500 mt-1">12 de Agosto, 2023 • 18:00 - 22:00</p>
          </div>
        </div>

        <div className="text-center space-y-3">
          <h3 className="text-[16px] font-semibold text-slate-800 dark:text-slate-100">¿Cómo calificarías tu experiencia?</h3>
          <div className="flex justify-center gap-1">
            {[1, 2, 3, 4, 5].map(i => (
              <span 
                key={i} 
                onClick={() => setMainRating(i)}
                className={`material-icons text-5xl cursor-pointer transition-colors ${i <= mainRating ? 'text-[#F2B134]' : 'text-gray-300 dark:text-gray-700'}`}
              >
                star
              </span>
            ))}
          </div>
          <p className="text-primary font-medium text-lg italic">{getRatingText(mainRating)}</p>
        </div>

        <div className="space-y-4">
          <h3 className="text-[16px] font-semibold text-slate-800 dark:text-slate-100">Califica aspectos específicos</h3>
          <div className="space-y-3">
            {Object.entries(aspectRatings).map(([label, stars]) => (
              <div key={label} className="flex items-center justify-between">
                <span className="text-slate-700 dark:text-slate-300 font-medium">{label}</span>
                <div className="flex gap-0.5">
                  {[1, 2, 3, 4, 5].map(s => (
                    <span 
                      key={s} 
                      onClick={() => handleAspectRating(label, s)}
                      className={`material-icons text-xl cursor-pointer transition-colors ${s <= (stars as number) ? 'text-[#F2B134]' : 'text-gray-300 dark:text-gray-700'}`}
                    >
                      star
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="space-y-3">
          <h3 className="text-[16px] font-semibold text-slate-800 dark:text-slate-100">Comparte tu experiencia</h3>
          <div className="relative">
            <textarea 
              className="w-full p-4 border border-gray-200 dark:border-gray-800 rounded-2xl focus:ring-primary focus:border-primary bg-white dark:bg-surface-dark text-sm placeholder:text-slate-400 dark:placeholder:text-slate-600 outline-none resize-none" 
              placeholder="Cuéntanos cómo fue tu experiencia en este lugar..." 
              rows={4}
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              maxLength={250}
            />
            <div className="text-right mt-1 text-xs text-slate-400 dark:text-slate-600">{comment.length}/250</div>
          </div>
        </div>

        <div className="space-y-3 pb-4">
          <h3 className="text-[16px] font-semibold text-slate-800 dark:text-slate-100">Añade fotos de tu evento (opcional)</h3>
          <div className="flex gap-3 overflow-x-auto pb-2 no-scrollbar">
            <div className="flex-shrink-0 w-24 h-24 border-2 border-dashed border-gray-200 dark:border-gray-800 rounded-xl flex items-center justify-center bg-gray-50 dark:bg-gray-900 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
              <span className="material-icons text-gray-300 dark:text-gray-700 text-3xl">add_photo_alternate</span>
            </div>
            {['https://lh3.googleusercontent.com/aida-public/AB6AXuBeD_o1hOuusGhRC-qpK-0XDgCGO-UhCPn72mpzx5C9jkDNXbW0t0s7HRm1HNzIHJawBEdN8WIaT8Mhqjtw2b4qu88FUUzTYaneLUIdTj_LWNA8BBkw_ZovYkimebipJBAzPWvucRnKXR8pz4vdmbDxdYDXRFy06HjN3UQiTOXc3Z8WcXo9wNvpyCelKDqrx9AML8RIqMALSaOoRr8lEo8_5aDOmBGo0Db3H3VA0RluOeeLpQ1KiJtPxcbJd6SmcNt6V2fQTxPJ3V0g', 'https://lh3.googleusercontent.com/aida-public/AB6AXuC8CzL_TISuguNpKQV2N4sARQ2KhvS5T7zPSvS6z6xkN_nVG7Tar2omc11no_iNrv_aH3uti5rUkJdIdFDxyRQ_BAYzofsD2RZ5JWfR-yEaiL5iHgr1pRmlb3SiqRGInggzoI25VCeZUG8KCq4cFuXTIDMW8mQ210Qjy_QAb_FDBbye4TfBXggmNfzUrWpxPwkTzmvsBBP8jOJ5kDkCHLb6r_p_2q62u8m0HfTtkCIjYuXep3vCyQjJXYLWHWN0PwpjaI9kEtplYDuL'].map((img, i) => (
              <div key={i} className="relative flex-shrink-0 w-24 h-24 rounded-xl overflow-hidden shadow-sm">
                <img alt="Event" className="w-full h-full object-cover" src={img} />
                <button className="absolute top-1 right-1 bg-black/50 rounded-full p-0.5">
                  <span className="material-icons text-white text-[14px]">close</span>
                </button>
              </div>
            ))}
          </div>
        </div>
      </main>

      <footer className="fixed bottom-0 left-0 right-0 max-w-md mx-auto bg-white/90 dark:bg-background-dark/90 backdrop-blur-md border-t border-gray-100 dark:border-gray-800 px-5 pt-4 pb-8 space-y-3 z-50">
        <div className="flex gap-3">
          <button 
            onClick={() => navigate(-1)}
            className="flex-1 py-3.5 border-2 border-secondary text-secondary font-semibold rounded-2xl hover:bg-secondary/5 transition-colors"
          >
            Omitir
          </button>
          <button 
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="flex-1 py-3.5 bg-primary text-white font-semibold rounded-2xl shadow-lg shadow-primary/20 hover:opacity-90 transition-opacity disabled:opacity-60"
          >
            {isSubmitting ? 'Publicando…' : 'Publicar reseña'}
          </button>
        </div>
        <p className="text-center text-[11px] text-slate-400 dark:text-slate-500 max-w-[280px] mx-auto leading-relaxed">
          Tu opinión ayuda a otros usuarios a encontrar los mejores lugares
        </p>
      </footer>
    </div>
  );
};

export default RateExperience;
