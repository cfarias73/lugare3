
import React, { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import ProviderLayout from '../../components/ProviderLayout';
import { toast } from 'sonner';

const AvailabilityCalendar: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const isWizard = searchParams.get('wizard') === 'true';
  const [blockedDates, setBlockedDates] = useState<number[]>([26, 27]);

  const toggleBlockedDate = (day: number) => {
    if (blockedDates.includes(day)) {
      setBlockedDates(blockedDates.filter(d => d !== day));
      toast.success(`Día ${day} desbloqueado`);
    } else {
      setBlockedDates([...blockedDates, day]);
      toast.success(`Día ${day} bloqueado`);
    }
  };

  const Content = (
    <div className="p-6 space-y-10 max-w-lg mx-auto pb-10">
      {isWizard && (
        <div className="animate-in fade-in duration-500">
          <div className="flex justify-between items-end mb-3">
            <span className="text-sm font-bold text-slate-900 dark:text-white tracking-tight uppercase">Progreso</span>
            <span className="text-xs font-bold text-primary uppercase tracking-widest">Paso 4 de 4</span>
          </div>
          <div className="w-full h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
            <div className="bg-primary h-full rounded-full transition-all duration-700 shadow-[0_0_10px_rgba(242,107,58,0.4)] w-full"></div>
          </div>
        </div>
      )}

      <div className="bg-white dark:bg-surface-dark rounded-[32px] p-6 shadow-sm border border-slate-100 dark:border-slate-800 flex items-center justify-between group transition-all">
        <button className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-slate-50 dark:hover:bg-slate-800 transition-all text-slate-400 active:scale-75">
          <span className="material-icons-outlined">chevron_left</span>
        </button>
        <div className="flex items-center gap-3 font-bold text-lg dark:text-white tracking-tight">
          <span>Agosto 2024</span>
          <span className="material-icons-outlined text-secondary text-2xl">calendar_today</span>
        </div>
        <button className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-slate-50 dark:hover:bg-slate-800 transition-all text-slate-400 active:scale-75">
          <span className="material-icons-outlined">chevron_right</span>
        </button>
      </div>

      <div className="bg-white dark:bg-surface-dark rounded-[36px] p-8 shadow-sm border border-slate-100 dark:border-slate-800">
        <div className="grid grid-cols-7 gap-y-6 text-center text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-8">
          <div>L</div><div>M</div><div>M</div><div>J</div><div>V</div><div>S</div><div>D</div>
        </div>
        <div className="grid grid-cols-7 gap-y-4 text-center text-sm font-bold dark:text-white">
          <div className="text-slate-200 dark:text-slate-800">31</div>
          {Array.from({ length: 31 }, (_, i) => i + 1).map((day) => {
            const isBlocked = blockedDates.includes(day);
            let classes = "w-10 h-10 flex items-center justify-center mx-auto rounded-full transition-all cursor-pointer hover:bg-slate-50 active:scale-75";
            
            if (isBlocked) {
              classes = "w-10 h-10 bg-slate-100 dark:bg-slate-800 text-slate-400 flex items-center justify-center mx-auto rounded-[14px] cursor-pointer";
            } else if (day === 15) {
              classes = "w-10 h-10 bg-secondary text-white rounded-[14px] flex items-center justify-center mx-auto shadow-lg shadow-secondary/30 active:scale-90";
            } else if (day === 5 || day === 23) {
              classes += " relative after:content-[''] after:absolute after:bottom-1 after:left-1/2 after:-translate-x-1/2 after:w-4 after:h-1 after:bg-primary after:rounded-full";
            }
            
            return (
              <div 
                key={day} 
                className={classes}
                onClick={() => toggleBlockedDate(day)}
              >
                {day}
              </div>
            );
          })}
        </div>
        
        <div className="mt-12 flex flex-wrap justify-center gap-x-6 gap-y-4">
          <div className="flex items-center gap-2">
            <div className="w-2.5 h-2.5 rounded-full bg-secondary"></div>
            <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Seleccionado</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2.5 h-2.5 rounded-sm bg-slate-200 dark:bg-slate-800"></div>
            <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Bloqueado</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2.5 h-2.5 rounded-full border-2 border-primary"></div>
            <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Disponible</span>
          </div>
        </div>
      </div>

      <section>
        <h2 className="text-lg font-bold mb-6 px-1 dark:text-white tracking-tight">Precios por temporada</h2>
        <div className="bg-white dark:bg-surface-dark rounded-[36px] p-8 shadow-sm border border-slate-100 dark:border-slate-800 space-y-8 transition-all">
          <div className="flex justify-between items-end mb-3 px-1">
            <p className="text-sm font-bold text-slate-900 dark:text-white">Precio base estándar</p>
            <p className="text-xl font-bold text-primary font-display">$3,500 <span className="text-[10px] font-medium text-slate-400">MXN</span></p>
          </div>
          <div className="w-full bg-slate-50 dark:bg-slate-800/50 h-2.5 rounded-full overflow-hidden shadow-inner">
            <div className="bg-primary h-full w-[70%] rounded-full shadow-[0_0_10px_rgba(242,107,58,0.3)]"></div>
          </div>
          
          <button className="w-full border-2 border-primary text-primary font-bold py-4 rounded-2xl transition-all hover:bg-primary/5 active:scale-95 uppercase tracking-widest text-[11px]">
            Configurar temporadas especiales
          </button>
        </div>
      </section>
    </div>
  );

  if (isWizard) {
    return (
      <div className="flex flex-col min-h-screen bg-background-light dark:bg-background-dark max-w-md mx-auto shadow-2xl relative transition-colors overflow-hidden border-x border-slate-100 dark:border-slate-800">
        <header className="sticky top-0 z-50 bg-white/90 dark:bg-surface-dark/90 backdrop-blur-md border-b border-slate-100 dark:border-slate-800 px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button onClick={() => navigate(-1)} className="p-2 -ml-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors active:scale-90">
              <span className="material-icons-outlined block">arrow_back</span>
            </button>
            <h1 className="text-lg font-bold text-slate-900 dark:text-white font-display tracking-tight">Disponibilidad</h1>
          </div>
          <button onClick={() => navigate('/provider/dashboard')} className="p-2 -mr-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors">
            <span className="material-icons-outlined block">close</span>
          </button>
        </header>

        <main className="flex-1 pb-32 overflow-y-auto no-scrollbar">
          {Content}
        </main>

        <footer className="fixed bottom-0 left-0 right-0 bg-white/95 dark:bg-surface-dark/95 backdrop-blur-xl border-t border-slate-100 dark:border-slate-800 px-6 py-6 flex gap-4 max-w-md mx-auto z-[60]">
          <button className="flex-1 py-4 border-2 border-primary text-primary font-bold text-[11px] uppercase tracking-[0.15em] rounded-2xl transition-all active:scale-95 hover:bg-primary/5">
            Guardar
          </button>
          <button 
            onClick={() => navigate('/provider/spaces')}
            className="flex-1 py-4 bg-primary text-white font-bold text-[11px] uppercase tracking-[0.15em] rounded-2xl shadow-xl shadow-primary/20 transition-all active:scale-95 hover:bg-orange-600"
          >
            Finalizar
          </button>
        </footer>
      </div>
    );
  }

  return (
    <ProviderLayout>
      <header className="sticky top-0 z-50 bg-white/80 dark:bg-surface-dark/80 backdrop-blur-xl px-6 py-5 flex items-center justify-between border-b border-slate-100 dark:border-slate-800 transition-colors">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate(-1)} className="w-11 h-11 flex items-center justify-center rounded-2xl bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 transition-all active:scale-90 shadow-sm border border-slate-100 dark:border-slate-800">
            <span className="material-icons-outlined text-xl">arrow_back</span>
          </button>
          <div>
            <h1 className="text-lg font-bold leading-tight dark:text-white font-display tracking-tight">Disponibilidad</h1>
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Casa Jardín</p>
          </div>
        </div>
        <button className="w-11 h-11 flex items-center justify-center rounded-2xl bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 transition-all active:scale-90 shadow-sm border border-slate-100 dark:border-slate-800">
          <span className="material-icons-outlined text-xl">more_vert</span>
        </button>
      </header>
      {Content}
    </ProviderLayout>
  );
};

export default AvailabilityCalendar;
