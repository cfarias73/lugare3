
import React, { useRef, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { ArrowLeft, Star, ImagePlus, X } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '../../lib/supabaseClient';
import { useUser } from '../../context/UserContext';
import { createNotification } from '../../src/services/notificationService';

interface RateState {
  bookingId?: string;
  venueId?: string;
  venueName?: string;
  image?: string;
  date?: string;
  time?: string;
}

const DEFAULT_IMAGE = 'https://images.unsplash.com/photo-1519167758481-83f5e181dcc3?auto=format&fit=crop&q=80&w=400';

const withTimeout = <T,>(promise: Promise<T>, ms: number, label: string): Promise<T> =>
  Promise.race([
    promise,
    new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error(`Tiempo de espera agotado (${label}). Intenta de nuevo.`)), ms)
    ),
  ]);

const compressImageFile = (file: File, maxDim = 1400, quality = 0.8): Promise<{ blob: Blob; ext: string; contentType: string }> =>
  new Promise((resolve) => {
    const fallbackExt = (file.name.split('.').pop() || 'jpg').toLowerCase().replace(/[^a-z0-9]/g, '') || 'jpg';
    const fallback = () => resolve({ blob: file, ext: fallbackExt, contentType: file.type || 'image/jpeg' });

    const img = new Image();
    const objUrl = URL.createObjectURL(file);
    const timer = setTimeout(() => {
      URL.revokeObjectURL(objUrl);
      fallback();
    }, 5000);

    img.onload = () => {
      clearTimeout(timer);
      URL.revokeObjectURL(objUrl);
      try {
        let { width, height } = img;
        if (width > maxDim || height > maxDim) {
          const ratio = Math.min(maxDim / width, maxDim / height);
          width = Math.round(width * ratio);
          height = Math.round(height * ratio);
        }
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) return fallback();
        ctx.drawImage(img, 0, 0, width, height);
        canvas.toBlob(
          (blob) => {
            if (!blob) return fallback();
            resolve({ blob, ext: 'jpg', contentType: 'image/jpeg' });
          },
          'image/jpeg',
          quality
        );
      } catch {
        fallback();
      }
    };
    img.onerror = () => {
      clearTimeout(timer);
      URL.revokeObjectURL(objUrl);
      fallback();
    };
    img.src = objUrl;
  });

const RateExperience: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user: ctxUser } = useUser();
  const state = (location.state as RateState | null) || {};
  const bookingId = state.bookingId || null;
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
  const [photos, setPhotos] = useState<{ url: string; file: File }[]>([]);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const handleAspectRating = (aspect: string, rating: number) => {
    setAspectRatings(prev => ({ ...prev, [aspect]: rating }));
  };

  const handleAddPhotos = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const remaining = Math.max(0, 5 - photos.length);
    const next = files.slice(0, remaining).map(file => ({
      url: URL.createObjectURL(file),
      file,
    }));
    setPhotos(prev => [...prev, ...next]);
    if (e.target) e.target.value = '';
  };

  const removePhoto = (idx: number) => {
    setPhotos(prev => {
      const copy = [...prev];
      const [removed] = copy.splice(idx, 1);
      if (removed) URL.revokeObjectURL(removed.url);
      return copy;
    });
  };

  const handleSubmit = async () => {
    if (isSubmitting) return;
    if (!venueId || !bookingId) {
      toast.error('Selecciona una reserva desde "Pasadas" en Reservas para valorarla.');
      navigate('/user/bookings');
      return;
    }
    setIsSubmitting(true);
    try {
      let userId = ctxUser?.id;
      if (!userId) {
        const { data: { user } } = await withTimeout(supabase.auth.getUser(), 10000, 'sesión');
        userId = user?.id;
      }
      if (!userId) {
        toast.error('Debes iniciar sesión para publicar una reseña.');
        navigate('/user/login');
        return;
      }

      // Subir fotos a review-photos/{user_id}/{timestamp}-{i}.{ext}
      const uploadedUrls: string[] = [];
      for (let i = 0; i < photos.length; i++) {
        const { file } = photos[i];
        const { blob, ext, contentType } = await compressImageFile(file);
        const path = `${userId}/${Date.now()}-${i}.${ext}`;
        const { error: upErr } = await withTimeout(
          supabase.storage.from('review-photos').upload(path, blob, { contentType, upsert: false }),
          25000,
          `foto ${i + 1}`
        );
        if (upErr) throw upErr;
        const { data: pub } = supabase.storage.from('review-photos').getPublicUrl(path);
        uploadedUrls.push(pub.publicUrl);
      }

      const { error } = await withTimeout(
        Promise.resolve(
          supabase.from('reviews').insert({
            booking_id: bookingId,
            user_id: userId,
            venue_id: venueId,
            rating: mainRating,
            comment: comment.trim() || null,
            photos: uploadedUrls,
          })
        ),
        15000,
        'guardar reseña'
      );
      if (error) {
        if ((error as any).code === '23505') {
          throw new Error('Ya calificaste esta reserva.');
        }
        throw error;
      }

      // Notificar al anfitrión en segundo plano sin bloquear la navegación
      void (async () => {
        try {
          const { data: venue } = await supabase
            .from('venues')
            .select('name, provider_id')
            .eq('id', venueId)
            .maybeSingle();
          if (venue?.provider_id) {
            await createNotification({
              userId: venue.provider_id,
              title: 'Nueva reseña recibida',
              message: `Recibiste una reseña de ${mainRating}★ en ${venue.name}.`,
              type: 'info',
              link: '/provider/stats',
            });
          }
        } catch (notifErr) {
          console.error('notify provider review failed', notifErr);
        }
      })();

      toast.success('¡Gracias por tu reseña!');
      navigate('/user/bookings');
    } catch (e: any) {
      console.error(e);
      toast.error(`No se pudo guardar la reseña: ${e?.message || 'error desconocido'}`);
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
      <header className="sticky top-0 z-50 bg-background-light dark:bg-background-dark border-b border-gray-200 dark:border-gray-800 px-4 pt-[calc(env(safe-area-inset-top,0px)+1rem)] pb-4 flex items-center">
        <button 
          onClick={() => navigate(-1)}
          className="p-1 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors"
        >
          <ArrowLeft className="w-6 h-6 text-slate-700 dark:text-slate-300" />
        </button>
        <h1 className="flex-1 text-center text-lg font-semibold text-slate-800 dark:text-white mr-8">Valorar experiencia</h1>
      </header>

      <main className="flex-1 overflow-y-auto px-5 py-4 space-y-6 pb-32">
        <div className="p-4 border border-gray-100 dark:border-gray-800 rounded-2xl bg-white dark:bg-surface-dark shadow-sm flex items-center gap-4">
          <img alt={venueName} className="w-20 h-20 rounded-xl object-cover shadow-sm" src={venueImage}/>
          <div className="flex-1">
            <h2 className="text-lg font-semibold text-slate-800 dark:text-white leading-tight">{venueName}</h2>
            <p className="text-sm text-slate-500 dark:text-slate-400">Espacio para eventos</p>
            {(venueDate || venueTime) && (
              <p className="text-[12px] text-slate-400 dark:text-slate-500 mt-1">{venueDate} {venueTime && `• ${venueTime}`}</p>
            )}
            {!venueId && (
              <p className="text-[11px] text-amber-600 mt-1">Selecciona una reserva pasada en "Reservas" para valorarla.</p>
            )}
          </div>
        </div>

        <div className="text-center space-y-3">
          <h3 className="text-[16px] font-semibold text-slate-800 dark:text-slate-100">¿Cómo calificarías tu experiencia?</h3>
          <div className="flex justify-center gap-1">
            {[1, 2, 3, 4, 5].map(i => (
              <button
                key={i}
                type="button"
                onClick={() => setMainRating(i)}
                className="transition-transform hover:scale-110"
              >
                <Star
                  className={`w-12 h-12 ${i <= mainRating ? 'fill-[#F2B134] text-[#F2B134]' : 'fill-transparent text-gray-300 dark:text-gray-700'}`}
                />
              </button>
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
                    <button
                      key={s}
                      type="button"
                      onClick={() => handleAspectRating(label, s)}
                      className="transition-transform hover:scale-110"
                    >
                      <Star
                        className={`w-5 h-5 ${s <= (stars as number) ? 'fill-[#F2B134] text-[#F2B134]' : 'fill-transparent text-gray-300 dark:text-gray-700'}`}
                      />
                    </button>
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
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            multiple
            className="hidden"
            onChange={handleAddPhotos}
          />
          <div className="flex gap-3 overflow-x-auto pb-2 no-scrollbar">
            {photos.length < 5 && (
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="flex-shrink-0 w-24 h-24 border-2 border-dashed border-gray-200 dark:border-gray-800 rounded-xl flex items-center justify-center bg-gray-50 dark:bg-gray-900 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
              >
                <ImagePlus className="w-8 h-8 text-gray-400 dark:text-gray-600" />
              </button>
            )}
            {photos.map((p, i) => (
              <div key={p.url} className="relative flex-shrink-0 w-24 h-24 rounded-xl overflow-hidden shadow-sm">
                <img alt={`Foto ${i + 1}`} className="w-full h-full object-cover" src={p.url} />
                <button
                  type="button"
                  onClick={() => removePhoto(i)}
                  className="absolute top-1 right-1 bg-black/50 hover:bg-black/70 rounded-full p-0.5"
                >
                  <X className="w-3.5 h-3.5 text-white" />
                </button>
              </div>
            ))}
          </div>
          <p className="text-[11px] text-slate-400 dark:text-slate-500">Máximo 5 fotos</p>
        </div>
      </main>


      <footer className="fixed bottom-0 left-0 right-0 max-w-md mx-auto bg-white/90 dark:bg-background-dark/90 backdrop-blur-md border-t border-gray-100 dark:border-gray-800 px-5 pt-4 pb-[calc(env(safe-area-inset-bottom,0px)+1.25rem)] space-y-3 z-50">
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
