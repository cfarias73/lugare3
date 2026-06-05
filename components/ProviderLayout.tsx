
import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useUser } from '../context/UserContext';

interface ProviderLayoutProps {
  children: React.ReactNode;
  hideLogout?: boolean;
}

const ProviderLayout: React.FC<ProviderLayoutProps> = ({ children }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { logout } = useUser();

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  const isActive = (path: string) => location.pathname === path;

  return (
    <div className="flex flex-col min-h-screen bg-background-light dark:bg-background-dark max-w-md mx-auto shadow-2xl relative transition-colors overflow-hidden border-x border-slate-100 dark:border-slate-800">
      <header className="absolute top-4 right-4 z-50">
        <button onClick={handleLogout} className="bg-red-500 text-white text-xs font-bold px-3 py-1 rounded-full shadow-lg">Salir</button>
      </header>
      <main className="flex-1 pb-24 overflow-y-auto no-scrollbar">
        {children}
      </main>

      <nav className="fixed bottom-0 inset-x-0 max-w-md mx-auto bg-white/95 dark:bg-surface-dark/95 backdrop-blur-xl border-t border-slate-100 dark:border-slate-800 px-6 py-4 pb-8 flex justify-between items-center z-50">
        <button 
          onClick={() => navigate('/provider/dashboard')}
          className={`flex flex-col items-center gap-1 transition-colors ${isActive('/provider/dashboard') ? 'text-primary' : 'text-slate-400'}`}
        >
          <span className={`material-icons-round text-2xl ${isActive('/provider/dashboard') ? 'fill-current' : ''}`}>home</span>
          <span className="text-[10px] font-bold tracking-tight">Inicio</span>
        </button>
        <button 
          onClick={() => navigate('/provider/received-bookings')}
          className={`flex flex-col items-center gap-1 transition-colors ${isActive('/provider/received-bookings') ? 'text-primary' : 'text-slate-400'}`}
        >
          <span className={`material-icons-round text-2xl ${isActive('/provider/received-bookings') ? 'fill-current' : ''}`}>calendar_month</span>
          <span className="text-[10px] font-bold tracking-tight">Reservas</span>
        </button>
        <button 
          onClick={() => navigate('/provider/spaces')}
          className={`flex flex-col items-center gap-1 transition-colors ${isActive('/provider/spaces') ? 'text-primary' : 'text-slate-400'}`}
        >
          <span className={`material-icons-round text-2xl ${isActive('/provider/spaces') ? 'fill-current' : ''}`}>location_on</span>
          <span className="text-[10px] font-bold tracking-tight">Lugares</span>
        </button>
        <button 
          onClick={() => navigate('/provider/messages')}
          className={`flex flex-col items-center gap-1 transition-colors ${isActive('/provider/messages') ? 'text-primary' : 'text-slate-400'}`}
        >
          <span className={`material-icons-round text-2xl ${isActive('/provider/messages') ? 'fill-current' : ''}`}>chat</span>
          <span className="text-[10px] font-bold tracking-tight">Mensajes</span>
        </button>
      </nav>
    </div>
  );
};

export default ProviderLayout;
