
import React from 'react';
import { useNavigate } from 'react-router-dom';

const Welcome: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-white dark:bg-background-dark flex flex-col items-center justify-center p-6 max-w-md mx-auto relative overflow-hidden">
      {/* Decorative Elements */}
      <div className="absolute -top-20 -left-20 w-64 h-64 bg-primary/10 rounded-full blur-3xl"></div>
      <div className="absolute -bottom-20 -right-20 w-64 h-64 bg-secondary/10 rounded-full blur-3xl"></div>

      <div className="z-10 w-full flex flex-col items-center text-center space-y-12">
        <div className="space-y-4">
          <div className="w-24 h-24 bg-primary rounded-[32px] flex items-center justify-center shadow-2xl shadow-primary/30 mx-auto transform -rotate-6">
            <span className="material-icons-round text-white text-5xl">location_on</span>
          </div>
          <h1 className="text-4xl font-bold font-display tracking-tight text-slate-900 dark:text-white">LUGARE</h1>
          <p className="text-slate-500 dark:text-slate-400 font-medium">Encuentra o promociona el lugar ideal para tu evento</p>
        </div>

        <div className="w-full space-y-4">
          <button 
            onClick={() => navigate('/user/login')}
            className="w-full group relative bg-white dark:bg-surface-dark border-2 border-slate-100 dark:border-slate-800 p-6 rounded-[32px] flex items-center gap-5 transition-all hover:border-primary hover:shadow-xl hover:shadow-primary/5 active:scale-95"
          >
            <div className="w-14 h-14 rounded-2xl bg-orange-50 dark:bg-orange-900/20 flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-white transition-colors">
              <span className="material-icons-round text-3xl">celebration</span>
            </div>
            <div className="text-left">
              <h3 className="font-bold text-lg dark:text-white">Busco un lugar</h3>
              <p className="text-sm text-slate-500">Para mi boda, fiesta o evento</p>
            </div>
            <span className="material-icons-round ml-auto text-slate-300 group-hover:text-primary transition-colors">chevron_right</span>
          </button>

          <button 
            onClick={() => navigate('/provider/login')}
            className="w-full group relative bg-white dark:bg-surface-dark border-2 border-slate-100 dark:border-slate-800 p-6 rounded-[32px] flex items-center gap-5 transition-all hover:border-secondary hover:shadow-xl hover:shadow-secondary/5 active:scale-95"
          >
            <div className="w-14 h-14 rounded-2xl bg-cyan-50 dark:bg-cyan-900/20 flex items-center justify-center text-secondary group-hover:bg-secondary group-hover:text-white transition-colors">
              <span className="material-icons-round text-3xl">apartment</span>
            </div>
            <div className="text-left">
              <h3 className="font-bold text-lg dark:text-white">Soy anfitrión</h3>
              <p className="text-sm text-slate-500">Quiero rentar mi espacio</p>
            </div>
            <span className="material-icons-round ml-auto text-slate-300 group-hover:text-secondary transition-colors">chevron_right</span>
          </button>
        </div>

        <div className="flex flex-col items-center gap-2">
          <p className="text-xs text-slate-400 dark:text-slate-600 font-medium">
            © 2026 Lugare. Todos los derechos reservados.
          </p>
          <button 
            onClick={() => navigate('/admin/login')}
            className="text-[10px] text-slate-300 dark:text-slate-700 hover:text-slate-500 transition-colors uppercase tracking-widest"
          >
            Admin
          </button>
        </div>
      </div>
    </div>
  );
};

export default Welcome;
