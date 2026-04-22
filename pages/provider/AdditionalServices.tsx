
import React from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import ProviderLayout from '../../components/ProviderLayout';

const AdditionalServices: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const isWizard = searchParams.get('wizard') === 'true';

  const Content = (
    <div className="p-6 space-y-10">
      {isWizard && (
        <div className="animate-in fade-in duration-500">
          <div className="flex justify-between items-end mb-3">
            <span className="text-sm font-bold text-slate-900 dark:text-white tracking-tight uppercase">Progreso</span>
            <span className="text-xs font-bold text-primary uppercase tracking-widest">Paso 3 de 4</span>
          </div>
          <div className="w-full h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
            <div className="bg-primary h-full rounded-full transition-all duration-700 shadow-[0_0_10px_rgba(242,107,58,0.4)] w-3/4"></div>
          </div>
        </div>
      )}

      <section className="bg-white dark:bg-surface-dark border-l-4 border-secondary rounded-[28px] p-6 flex gap-5 shadow-sm border border-slate-100 dark:border-slate-800">
        <div className="bg-cyan-50 dark:bg-cyan-900/30 p-3 rounded-2xl h-fit text-secondary transform rotate-6">
          <span className="material-icons-outlined text-2xl">auto_awesome</span>
        </div>
        <div>
          <h2 className="font-bold text-slate-900 dark:text-white text-base mb-1 tracking-tight">Aumenta el valor de tu espacio</h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed font-medium">
            Ofrece servicios adicionales para mejorar la experiencia de tus huéspedes y aumentar tus ingresos.
          </p>
        </div>
      </section>

      <button className="w-full bg-primary hover:bg-orange-600 text-white font-bold py-5 rounded-2xl shadow-xl shadow-primary/20 flex items-center justify-center gap-3 transition-all active:scale-[0.98] uppercase tracking-widest text-xs">
        <span className="material-icons-outlined text-xl">add_circle_outline</span>
        Añadir nuevo servicio
      </button>

      <div className="space-y-6">
        <h3 className="font-bold text-slate-800 dark:text-slate-200 px-1 tracking-tight">Mis servicios adicionales</h3>
        
        {[
          { name: 'Servicio de catering', price: '$250 por evento', type: 'Comida y bebida', icon: 'restaurant', color: 'bg-amber-100 dark:bg-amber-900/30 text-amber-600', active: true, desc: 'Servicio de catering para eventos con opciones de menú variadas. Incluye personal de servicio.' },
          { name: 'Decoración temática', price: '$180 por evento', type: 'Decoración', icon: 'palette', color: 'bg-rose-100 dark:bg-rose-900/30 text-rose-500', active: true, desc: 'Decoración personalizada según la temática del evento. Incluye montaje y desmontaje.' },
          { name: 'DJ profesional', price: '$300 por 4 horas', type: 'Música y entretenimiento', icon: 'headphones', color: 'bg-blue-100 dark:bg-blue-900/30 text-blue-500', active: false, desc: 'DJ profesional con equipo de sonido incluido. Experiencia en bodas y eventos corporativos.' },
          { name: 'Servicio de fotografía', price: '$200 por 2 horas', type: 'Fotografía', icon: 'photo_camera', color: 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-600', active: true, desc: 'Sesión profesional de fotos del evento. Entrega en formato digital de alta resolución.' }
        ].map((svc, i) => (
          <div key={i} className="bg-white dark:bg-surface-dark p-7 rounded-[32px] shadow-sm border border-slate-100 dark:border-slate-800 space-y-6 transition-all hover:shadow-md">
            <div className="flex justify-between items-start">
              <div className="flex gap-4">
                <div className={`w-14 h-14 rounded-2xl flex items-center justify-center ${svc.color} shadow-sm transition-transform`}>
                  <span className="material-icons-outlined text-2xl">{svc.icon}</span>
                </div>
                <div>
                  <h4 className="font-bold text-lg dark:text-white tracking-tight">{svc.name}</h4>
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">{svc.type}</p>
                </div>
              </div>
              <div className="flex gap-2">
                <button className="w-10 h-10 flex items-center justify-center text-secondary bg-cyan-50 dark:bg-cyan-900/20 rounded-xl hover:bg-secondary hover:text-white transition-all"><span className="material-icons-outlined text-lg">edit_note</span></button>
                <button className="w-10 h-10 flex items-center justify-center text-slate-300 hover:text-red-500 transition-all"><span className="material-icons-outlined text-lg">delete_outline</span></button>
              </div>
            </div>
            <div className="space-y-3 py-4 border-y border-slate-50 dark:border-slate-800/50">
              <div className="flex justify-between text-sm font-medium">
                <span className="text-slate-400">Precio base:</span>
                <span className="font-bold dark:text-white">{svc.price}</span>
              </div>
              <div className="flex justify-between text-sm font-medium">
                <span className="text-slate-400">Tipo:</span>
                <span className="font-bold dark:text-white">{svc.type}</span>
              </div>
              <div className="flex justify-between text-sm font-medium">
                <span className="text-slate-400">Disponibilidad:</span>
                <span className={`font-bold ${svc.active ? 'text-emerald-500' : 'text-slate-400'}`}>
                  {svc.active ? 'Activo' : 'Inactivo'}
                </span>
              </div>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed font-medium">
              {svc.desc}
            </p>
            <button className="text-secondary font-bold text-xs uppercase tracking-widest flex items-center gap-1.5 active:scale-95 transition-all">
              Ver detalles <span className="material-icons-round text-sm">arrow_forward</span>
            </button>
          </div>
        ))}
      </div>
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
            <h1 className="text-lg font-bold text-slate-900 dark:text-white font-display tracking-tight">Servicios Adicionales</h1>
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
            onClick={() => navigate('/provider/calendar?wizard=true')}
            className="flex-1 py-4 bg-primary text-white font-bold text-[11px] uppercase tracking-[0.15em] rounded-2xl shadow-xl shadow-primary/20 transition-all active:scale-95 hover:bg-orange-600"
          >
            Continuar
          </button>
        </footer>
      </div>
    );
  }

  return (
    <ProviderLayout>
      <header className="sticky top-0 z-50 bg-white dark:bg-surface-dark px-6 py-6 flex items-center justify-between border-b border-slate-100 dark:border-slate-800 transition-colors">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate(-1)} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors active:scale-90">
            <span className="material-icons-outlined text-slate-700 dark:text-slate-200">arrow_back</span>
          </button>
          <h1 className="text-xl font-bold dark:text-white font-display tracking-tight">Servicios Adicionales</h1>
        </div>
        <button className="text-secondary">
          <span className="material-icons-outlined">help_outline</span>
        </button>
      </header>
      {Content}
    </ProviderLayout>
  );
};

export default AdditionalServices;
