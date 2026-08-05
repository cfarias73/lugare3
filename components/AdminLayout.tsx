import React from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';
import { useUser } from '../context/UserContext';

const AdminLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const navigate = useNavigate();
  const { logout } = useUser();

  const handleLogout = () => {
    logout();
    navigate('/admin/login');
  };

  const navItems = [
    { name: 'Dashboard', path: '/admin/dashboard' },
    { name: 'Usuarios', path: '/admin/users' },
    { name: 'Anfitriones', path: '/admin/hosts' },
    { name: 'Espacios', path: '/admin/spaces' },
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
          <nav className="space-y-3">
            {navItems.map((item) => (
              <button 
                key={item.name} 
                onClick={() => navigate(item.path)}
                className="w-full text-left px-5 py-3.5 rounded-2xl text-sm font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all"
              >
                {item.name}
              </button>
            ))}
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
