import React from 'react';
import { formatLocalDate } from '../src/utils/date';

export interface InvitationPreviewData {
  designId?: string;
  eventName?: string;
  date?: string;
  time?: string;
  location?: string;
  coverImage?: string | null;
}

const designStyles: Record<string, { gradient: string; icon: string; label: string }> = {
  romantico: { gradient: 'from-pink-400 via-rose-300 to-orange-300', icon: 'favorite', label: 'Romántico' },
  celebracion: { gradient: 'from-sky-400 to-blue-500', icon: 'cake', label: 'Celebración' },
  corporativo: { gradient: 'from-slate-700 to-slate-900', icon: 'work', label: 'Corporativo' },
  fiesta: { gradient: 'from-purple-500 to-indigo-600', icon: 'music_note', label: 'Fiesta' },
  natural: { gradient: 'from-emerald-400 to-teal-600', icon: 'eco', label: 'Ecológico' },
};

const formatDate = (d?: string) => {
  if (!d) return '';
  try {
    return formatLocalDate(d, {
      weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
    }, 'es-MX');
  } catch { return d; }
};

const InvitationPreview: React.FC<{ data: InvitationPreviewData; className?: string }> = ({ data, className = '' }) => {
  const style = designStyles[data.designId || 'romantico'] || designStyles.romantico;
  return (
    <div className={`w-full max-w-md mx-auto bg-white rounded-3xl shadow-xl overflow-hidden ${className}`}>
      {data.coverImage ? (
        <div className="relative h-56">
          <img src={data.coverImage} alt={data.eventName || 'Evento'} className="w-full h-full object-cover" />
          <div className={`absolute inset-0 bg-gradient-to-t ${style.gradient} opacity-60`} />
          <div className="absolute inset-0 flex flex-col items-center justify-end p-6 text-white text-center">
            <span className="material-icons-outlined text-3xl mb-1 drop-shadow">{style.icon}</span>
            <p className="uppercase text-[10px] tracking-[0.3em] opacity-90">Estás invitado a</p>
            <h1 className="text-2xl font-bold font-display drop-shadow">{data.eventName || 'Nombre del evento'}</h1>
          </div>
        </div>
      ) : (
        <div className={`bg-gradient-to-br ${style.gradient} text-white p-10 text-center`}>
          <span className="material-icons-outlined text-5xl mb-3">{style.icon}</span>
          <p className="uppercase text-xs tracking-[0.3em] opacity-80 mb-2">Estás invitado a</p>
          <h1 className="text-3xl font-bold font-display">{data.eventName || 'Nombre del evento'}</h1>
        </div>
      )}
      <div className="p-6 space-y-4">
        {data.date && (
          <div className="flex items-start gap-3">
            <span className="material-icons-outlined text-primary">calendar_today</span>
            <div>
              <p className="text-[10px] uppercase tracking-wider text-slate-400 font-bold">Fecha</p>
              <p className="text-slate-800 font-medium capitalize text-sm">{formatDate(data.date)}</p>
            </div>
          </div>
        )}
        {data.time && (
          <div className="flex items-start gap-3">
            <span className="material-icons-outlined text-primary">schedule</span>
            <div>
              <p className="text-[10px] uppercase tracking-wider text-slate-400 font-bold">Hora</p>
              <p className="text-slate-800 font-medium text-sm">{data.time.slice(0, 5)} hrs</p>
            </div>
          </div>
        )}
        {data.location && (
          <div className="flex items-start gap-3">
            <span className="material-icons-outlined text-primary">place</span>
            <div>
              <p className="text-[10px] uppercase tracking-wider text-slate-400 font-bold">Ubicación</p>
              <p className="text-slate-800 font-medium text-sm">{data.location}</p>
            </div>
          </div>
        )}
        {!data.date && !data.time && !data.location && (
          <p className="text-center text-slate-400 text-sm py-4">Completa los datos para ver el diseño final</p>
        )}
      </div>
      <div className="border-t border-slate-100 p-4 text-center">
        <p className="text-[10px] text-slate-400">Invitación enviada a través de Lugare</p>
      </div>
    </div>
  );
};

export default InvitationPreview;
