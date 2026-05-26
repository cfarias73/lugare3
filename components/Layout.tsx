
import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

interface LayoutProps {
  children: React.ReactNode;
  hideNav?: boolean;
}

const Layout: React.FC<LayoutProps> = ({ children, hideNav = false }) => {
  const location = useLocation();
  const navigate = useNavigate();

  const isActive = (path: string) => location.pathname === path;

  return (
    <div className="flex flex-col min-h-screen bg-background-light dark:bg-background-dark max-w-md mx-auto shadow-2xl relative overflow-hidden border-x border-slate-100 dark:border-slate-800">
      <main className={`flex-1 flex flex-col ${hideNav ? '' : 'pb-[100px]'}`}>
        {children}
      </main>

      {!hideNav && (
        <div className="fixed bottom-0 inset-x-0 max-w-md mx-auto z-50 pointer-events-none">
          <nav className="pointer-events-auto bg-white dark:bg-surface-dark px-6 flex justify-between items-end relative h-[80px] pb-4 shadow-[0_-10px_40px_-10px_rgba(0,0,0,0.1)] rounded-t-[30px]">
            {/* Left Items */}
            <div className="flex gap-8 items-end pb-2">
              <button
                onClick={() => navigate('/user/home')}
                className={`flex flex-col items-center gap-1 transition-colors ${isActive('/user/home') ? 'text-primary' : 'text-slate-400 dark:text-slate-500'}`}
              >
                <span className="material-icons-round text-[28px]">home</span>
                <span className="text-[10px] font-bold">Inicio</span>
              </button>
              <button
                onClick={() => navigate('/user/explore')}
                className={`flex flex-col items-center gap-1 transition-colors ${isActive('/user/explore') ? 'text-primary' : 'text-slate-400 dark:text-slate-500'}`}
              >
                <span className="material-icons-round text-[28px]">explore</span>
                <span className="text-[10px] font-bold">Explorar</span>
              </button>
            </div>

            {/* Center Button */}
            <div className="absolute left-1/2 -translate-x-1/2 -top-8">
              <button 
                onClick={() => navigate('/user/bookings')}
                className="w-[64px] h-[64px] bg-primary rounded-full shadow-xl shadow-primary/40 flex items-center justify-center border-[5px] border-white dark:border-surface-dark transform active:scale-95 transition-transform"
              >
                <span className="material-icons-round text-white text-[32px]">calendar_month</span>
              </button>
            </div>

            {/* Right Items */}
            <div className="flex gap-8 items-end pb-2">
              <button
                onClick={() => navigate('/user/messages')}
                className={`flex flex-col items-center gap-1 transition-colors ${isActive('/user/messages') ? 'text-primary' : 'text-slate-400 dark:text-slate-500'}`}
              >
                <span className="material-icons-round text-[28px]">chat_bubble_outline</span>
                <span className="text-[10px] font-bold">Mensajes</span>
              </button>
              <button
                onClick={() => navigate('/user/profile')}
                className={`flex flex-col items-center gap-1 transition-colors ${isActive('/user/profile') ? 'text-primary' : 'text-slate-400 dark:text-slate-500'}`}
              >
                <span className="material-icons-round text-[28px]">person_outline</span>
                <span className="text-[10px] font-bold">Perfil</span>
              </button>
            </div>
          </nav>
        </div>
      )}
    </div>
  );
};

export default Layout;
