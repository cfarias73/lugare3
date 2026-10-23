import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { getPublicInvitation, PublicInvitation as PI } from '../src/services/invitationService';

const designStyles: Record<string, { gradient: string; icon: string; label: string }> = {
  romantico: { gradient: 'from-pink-400 via-rose-300 to-orange-300', icon: 'favorite', label: 'Romántico' },
  celebracion: { gradient: 'from-sky-400 to-blue-500', icon: 'cake', label: 'Celebración' },
  corporativo: { gradient: 'from-slate-700 to-slate-900', icon: 'work', label: 'Corporativo' },
  fiesta: { gradient: 'from-purple-500 to-indigo-600', icon: 'music_note', label: 'Fiesta' },
  natural: { gradient: 'from-emerald-400 to-teal-600', icon: 'eco', label: 'Ecológico' },
};

const formatDate = (d: string) => {
  if (!d) return '';
  try {
    return new Date(d + 'T00:00:00').toLocaleDateString('es-MX', {
      weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
    });
  } catch { return d; }
};

const PublicInvitation: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [inv, setInv] = useState<PI | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    if (!id) return;
    (async () => {
      const data = await getPublicInvitation(id);
      if (!data) setNotFound(true);
      else setInv(data);
      setLoading(false);
    })();
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <span className="material-icons-outlined animate-spin text-primary text-3xl">refresh</span>
      </div>
    );
  }

  if (notFound || !inv) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 p-6 text-center">
        <span className="material-icons-outlined text-slate-400 text-5xl mb-2">mail_outline</span>
        <h1 className="text-xl font-bold text-slate-800">Invitación no encontrada</h1>
        <p className="text-slate-500 mt-2">El enlace puede haber expirado o ser incorrecto.</p>
      </div>
    );
  }

  const style = designStyles[inv.design_id] || designStyles.romantico;

  return (
    <div className="min-h-screen bg-slate-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white rounded-3xl shadow-2xl overflow-hidden">
        {inv.cover_image_url ? (
          <div className="relative h-64">
            <img src={inv.cover_image_url} alt={inv.event_name} className="w-full h-full object-cover" />
            <div className={`absolute inset-0 bg-gradient-to-t ${style.gradient} opacity-60`} />
            <div className="absolute inset-0 flex flex-col items-center justify-end p-8 text-white text-center">
              <span className="material-icons-outlined text-4xl mb-2 drop-shadow">{style.icon}</span>
              <p className="uppercase text-xs tracking-[0.3em] opacity-90 mb-2">Estás invitado a</p>
              <h1 className="text-3xl font-bold font-display drop-shadow">{inv.event_name}</h1>
            </div>
          </div>
        ) : (
          <div className={`bg-gradient-to-br ${style.gradient} text-white p-10 text-center`}>
            <span className="material-icons-outlined text-5xl mb-3">{style.icon}</span>
            <p className="uppercase text-xs tracking-[0.3em] opacity-80 mb-2">Estás invitado a</p>
            <h1 className="text-3xl font-bold font-display">{inv.event_name}</h1>
          </div>
        )}
        <div className="p-8 space-y-5">
          {inv.event_date && (
            <div className="flex items-start gap-3">
              <span className="material-icons-outlined text-primary">calendar_today</span>
              <div>
                <p className="text-xs uppercase tracking-wider text-slate-400 font-bold">Fecha</p>
                <p className="text-slate-800 font-medium capitalize">{formatDate(inv.event_date)}</p>
              </div>
            </div>
          )}
          {inv.event_time && (
            <div className="flex items-start gap-3">
              <span className="material-icons-outlined text-primary">schedule</span>
              <div>
                <p className="text-xs uppercase tracking-wider text-slate-400 font-bold">Hora</p>
                <p className="text-slate-800 font-medium">{inv.event_time.slice(0, 5)} hrs</p>
              </div>
            </div>
          )}
          {inv.location && (
            <div className="flex items-start gap-3">
              <span className="material-icons-outlined text-primary">place</span>
              <div>
                <p className="text-xs uppercase tracking-wider text-slate-400 font-bold">Ubicación</p>
                <p className="text-slate-800 font-medium">{inv.location}</p>
                <a
                  href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(inv.location)}`}
                  target="_blank" rel="noreferrer"
                  className="text-sm text-primary font-semibold mt-1 inline-block"
                >Ver en mapa →</a>
              </div>
            </div>
          )}
        </div>
        <div className="border-t border-slate-100 p-6 text-center">
          <p className="text-xs text-slate-400">Invitación enviada a través de Lugare</p>
        </div>
      </div>
    </div>
  );
};

export default PublicInvitation;
