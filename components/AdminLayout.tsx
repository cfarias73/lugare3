import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';
import { useUser } from '../context/UserContext';
import { getPendingVenuesCount } from '../src/services/adminService';

const AdminLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { logout } = useUser();
  const [pendingCount, setPendingCount] = useState<number>(0);

  useEffect(() => {
    getPendingVenuesCount().then(setPendingCount).catch(() => {});
  }, [location.pathname]);

  const handleLogout = () => {
    logout();
    navigate('/admin/login');
  };

  const navItems = [
    { name: 'Dashboard', path: '/admin/dashboard' },
    { name: 'Usuarios', path: '/admin/users' },
    { name: 'Anfitriones', path: '/admin/hosts' },
    { name: 'Espacios', path: '/admin/spaces', badge: pendingCount },
    { name: 'Categorías', path: '/admin/categories' },
    { name: 'Reservas', path: '/admin/bookings' },
    { name: 'Finanzas', path: '/admin/finance' },
    { name: 'Pagos a anfitriones', path: '/admin/payouts' },
    { name: 'Reseñas', path: '/admin/reviews' },
    { name: 'Disputas', path: '/admin/disputes' },
    { name: 'Configuración', path: '/admin/settings' },
  ];

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-background-dark flex">
      <aside className="hidden md:flex w-72 bg-white dark:bg-surface-dark border-r border-slate-100 dark:border-slate-800 p-8 flex-col justify-between sticky top-0 h-screen">
        <div>
          <h2 className="text-2xl font-bold text-primary mb-12 font-display">Lugare Admin</h2>
          <nav className="space-y-2">
            {navItems.map((item) => {
              const isActive = location.pathname === item.path;
              return (
                <button 
                  key={item.name} 
                  onClick={() => navigate(item.path)}
                  className={`w-full flex items-center justify-between px-5 py-3 rounded-2xl text-sm font-bold transition-all ${
                    isActive 
                      ? 'bg-primary text-white shadow-md shadow-primary/20' 
                      : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                  }`}
                >
                  <span>{item.name}</span>
                  {Boolean(item.badge && item.badge > 0) && (
                    <span className={`px-2 py-0.5 text-xs rounded-full font-bold ${
                      isActive ? 'bg-white text-primary' : 'bg-amber-500 text-white'
                    }`}>
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
        </div>
        <button 
          onClick={handleLogout}
          className="w-full flex items-center gap-3 p-4 text-red-500 font-bold bg-red-50 dark:bg-red-900/10 rounded-2xl hover:bg-red-100 transition-colors"
        >
          <span className="material-icons-round">logout</span>
          Logout
        </button>
      </aside>
      <main className="flex-1 p-8 md:p-12 overflow-y-auto">
        {children}
      </main>
    </div>
  );
};

export default AdminLayout;
