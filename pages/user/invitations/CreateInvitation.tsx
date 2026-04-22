
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useUser } from '../../../context/UserContext';

const DESIGNS = [
  { 
    id: 'romantico', 
    name: 'Romántico', 
    icon: 'favorite', 
    color: 'from-pink-400 to-orange-400', 
    sub: 'Bodas y Aniversarios',
    description: 'Tonos pastel, tipografías elegantes y motivos florales para momentos inolvidables.',
    previewUrl: 'https://images.unsplash.com/photo-1511795409834-ef04bbd61622?auto=format&fit=crop&q=80&w=400'
  },
  { 
    id: 'celebracion', 
    name: 'Celebración', 
    icon: 'cake', 
    color: 'from-sky-400 to-blue-500', 
    sub: 'Cumpleaños y Logros',
    description: 'Colores vibrantes y un estilo festivo lleno de energía para celebrar la vida.',
    previewUrl: 'https://images.unsplash.com/photo-1464347601390-25e2842a37f7?auto=format&fit=crop&q=80&w=400'
  },
  { 
    id: 'corporativo', 
    name: 'Corporativo', 
    icon: 'work', 
    color: 'from-slate-700 to-slate-900', 
    sub: 'Eventos Profesionales',
    description: 'Diseño minimalista y sofisticado. Ideal para conferencias y lanzamientos.',
    previewUrl: 'https://images.unsplash.com/photo-1505373877841-8d25f7d46678?auto=format&fit=crop&q=80&w=400'
  },
  { 
    id: 'fiesta', 
    name: 'Fiesta', 
    icon: 'music_note', 
    color: 'from-purple-500 to-indigo-600', 
    sub: 'Cócteles y Baile',
    description: 'Estilo nocturno con toques modernos para eventos dinámicos y divertidos.',
    previewUrl: 'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?auto=format&fit=crop&q=80&w=400'
  },
  { 
    id: 'natural', 
    name: 'Ecológico', 
    icon: 'eco', 
    color: 'from-emerald-400 to-teal-600', 
    sub: 'Eventos al Aire Libre',
    description: 'Inspirado en la naturaleza con texturas orgánicas y paleta de colores tierra.',
    previewUrl: 'https://images.unsplash.com/photo-1519225421980-715cb0215aed?auto=format&fit=crop&q=80&w=400',
    fullWidth: true 
  },
];

const CreateInvitation: React.FC = () => {
  const navigate = useNavigate();
  const { updateDraftInvitation, draftInvitation } = useUser();
  const [selectedDesign, setSelectedDesign] = useState<string>(draftInvitation?.designId || 'romantico');
  const [eventName, setEventName] = useState(draftInvitation?.eventName || '');
  const [date, setDate] = useState(draftInvitation?.date || '');
  const [time, setTime] = useState(draftInvitation?.time || '');
  const [location, setLocation] = useState(draftInvitation?.location || '');

  const handleNext = () => {
    updateDraftInvitation({
      designId: selectedDesign,
      eventName,
      date,
      time,
      location
    });
    navigate('/user/invitations/guests');
  };

  return (
    <div className="bg-background-light dark:bg-background-dark text-slate-800 dark:text-slate-100 min-h-screen flex flex-col max-w-md mx-auto">
      <header className="sticky top-0 z-50 bg-white/80 dark:bg-background-dark/80 backdrop-blur-md px-4 py-4 flex items-center justify-between border-b border-gray-100 dark:border-gray-800">
        <button 
          onClick={() => navigate('/user/home')}
          className="p-2 -ml-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors active:scale-90"
        >
          <span className="material-icons-outlined text-slate-700 dark:text-slate-200">arrow_back</span>
        </button>
        <h1 className="text-lg font-bold text-slate-900 dark:text-white font-display tracking-tight">Personalizar Invitación</h1>
        <div className="w-10"></div> 
      </header>

      <main className="flex-1 overflow-y-auto px-5 pt-6 pb-32">
        <div className="mb-8">
          <div className="flex justify-between items-end mb-2">
            <span className="text-xs font-bold text-primary uppercase tracking-widest">Paso 1 de 3</span>
            <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">Estilo Visual</span>
          </div>
          <div className="h-1.5 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
            <div className="h-full bg-primary w-1/3 rounded-full transition-all duration-700"></div>
          </div>
        </div>

        <div className="mb-8">
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-2 font-display">Elige un estilo</h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
            Cada diseño ha sido curado para transmitir la esencia única de tu evento.
          </p>
        </div>

        <div className="space-y-6">
          <div className="grid grid-cols-1 gap-5">
            {DESIGNS.map((item) => {
              const isSelected = selectedDesign === item.id;
              return (
                <div 
                  key={item.id} 
                  onClick={() => setSelectedDesign(item.id)}
                  className={`group relative bg-white dark:bg-surface-dark rounded-[28px] overflow-hidden shadow-sm border-2 transition-all duration-500 cursor-pointer ${
                    isSelected 
                      ? 'border-primary ring-8 ring-primary/5 scale-[1.02] shadow-xl' 
                      : 'border-slate-100 dark:border-slate-800 hover:border-slate-200 dark:hover:border-slate-700'
                  }`}
                >
                  <div className="relative h-44 overflow-hidden">
                    <img 
                      src={item.previewUrl} 
                      alt={item.name} 
                      className={`w-full h-full object-cover transition-transform duration-700 ${isSelected ? 'scale-110' : 'group-hover:scale-105'}`}
                    />
                    <div className={`absolute inset-0 bg-gradient-to-t ${item.color} opacity-20 transition-opacity duration-500 ${isSelected ? 'opacity-40' : 'group-hover:opacity-30'}`}></div>
                    
                    <div className="absolute top-4 left-4 flex gap-2">
                       <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-white backdrop-blur-md transition-all duration-500 ${isSelected ? 'bg-primary' : 'bg-black/30'}`}>
                        <span className="material-icons-outlined text-xl">{item.icon}</span>
                      </div>
                    </div>

                    {isSelected && (
                      <div className="absolute top-4 right-4 bg-primary text-white w-10 h-10 rounded-full flex items-center justify-center shadow-lg animate-in zoom-in duration-300">
                        <span className="material-icons-round text-xl">check</span>
                      </div>
                    )}
                  </div>

                  <div className="p-5">
                    <div className="flex justify-between items-center mb-1">
                      <h3 className={`text-lg font-bold transition-colors ${isSelected ? 'text-primary' : 'text-slate-800 dark:text-white'}`}>{item.name}</h3>
                      <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-tighter">{item.sub}</span>
                    </div>
                    <p className="text-sm text-slate-500 dark:text-slate-400 leading-snug">
                      {item.description}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="pt-8 space-y-6">
            <h2 className="text-xl font-bold text-slate-900 dark:text-white font-display">Datos Básicos</h2>
            <div className="space-y-4">
              <div className="group">
                <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-2 ml-1 uppercase tracking-widest">Nombre del evento</label>
                <div className="relative">
                  <span className="material-icons-outlined absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-primary transition-colors">edit</span>
                  <input 
                    className="w-full pl-12 pr-4 py-4 bg-white dark:bg-surface-dark border border-slate-200 dark:border-slate-800 rounded-2xl focus:ring-4 focus:ring-primary/10 focus:border-primary text-slate-900 dark:text-white placeholder-slate-300 transition-all outline-none font-medium" 
                    placeholder="Ej. Gala de Aniversario" 
                    type="text"
                    value={eventName}
                    onChange={(e) => setEventName(e.target.value)}
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="group">
                  <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-2 ml-1 uppercase tracking-widest">Fecha</label>
                  <div className="relative">
                    <span className="material-icons-outlined absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-primary transition-colors">calendar_today</span>
                    <input 
                      className="w-full pl-11 pr-4 py-4 bg-white dark:bg-surface-dark border border-slate-200 dark:border-slate-800 rounded-2xl focus:ring-4 focus:ring-primary/10 focus:border-primary text-slate-900 dark:text-white placeholder-slate-300 transition-all outline-none text-sm" 
                      placeholder="DD/MM/AAAA" 
                      type="text"
                      value={date}
                      onChange={(e) => setDate(e.target.value)}
                    />
                  </div>
                </div>
                <div className="group">
                  <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-2 ml-1 uppercase tracking-widest">Hora</label>
                  <div className="relative">
                    <span className="material-icons-outlined absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-primary transition-colors">schedule</span>
                    <input 
                      className="w-full pl-11 pr-4 py-4 bg-white dark:bg-surface-dark border border-slate-200 dark:border-slate-800 rounded-2xl focus:ring-4 focus:ring-primary/10 focus:border-primary text-slate-900 dark:text-white placeholder-slate-300 transition-all outline-none text-sm" 
                      placeholder="HH:MM" 
                      type="text"
                      value={time}
                      onChange={(e) => setTime(e.target.value)}
                    />
                  </div>
                </div>
              </div>
              <div className="group">
                <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-2 ml-1 uppercase tracking-widest">Ubicación</label>
                <div className="relative">
                  <span className="material-icons-outlined absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-primary transition-colors">place</span>
                  <input 
                    className="w-full pl-12 pr-4 py-4 bg-white dark:bg-surface-dark border border-slate-200 dark:border-slate-800 rounded-2xl focus:ring-4 focus:ring-primary/10 focus:border-primary text-slate-900 dark:text-white placeholder-slate-300 transition-all outline-none font-medium" 
                    placeholder="Salón o Dirección" 
                    type="text"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      <footer className="fixed bottom-0 left-0 right-0 bg-white/95 dark:bg-background-dark/95 backdrop-blur-xl p-5 pb-8 border-t border-slate-100 dark:border-slate-800 max-w-md mx-auto z-50">
        <button 
          onClick={handleNext}
          className="w-full bg-primary hover:bg-orange-600 text-white font-bold py-4.5 rounded-[22px] transition-all shadow-xl shadow-primary/25 active:scale-95 flex items-center justify-center gap-2 group"
        >
          <span>Siguiente paso</span>
          <span className="material-icons-round text-lg group-hover:translate-x-1 transition-transform">arrow_forward</span>
        </button>
      </footer>
    </div>
  );
};

export default CreateInvitation;
