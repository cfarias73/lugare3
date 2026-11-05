import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import AdminLayout from '../../components/AdminLayout';
import { Skeleton } from '../../components/ui/Skeleton';
import { motion } from 'motion/react';
import { getAdminStats } from '../../src/services/adminService';
import { toast } from 'sonner';

const AdminDashboard: React.FC = () => {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(true);
  const [stats, setStats] = useState({ 
    userCount: 0, 
    providerCount: 0, 
    bookingCount: 0, 
    todayBookings: 0, 
    revenue: 0,
    pendingVenuesCount: 0,
  });

  useEffect(() => {
    getAdminStats()
      .then((s) => setStats(s as any))
      .catch((e) => toast.error(e.message || 'Error cargando estadísticas'))
      .finally(() => setIsLoading(false));
  }, []);

  if (isLoading) {
    return (
      <AdminLayout>
        <h1 className="text-2xl font-bold mb-6 dark:text-white">Dashboard</h1>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {[1, 2, 3, 4].map((i) => <Skeleton key={i} className="h-32 rounded-2xl" />)}
        </div>
      </AdminLayout>
    );
  }

  const cards = [
    { 
      label: 'Espacios por Aprobar', 
      value: stats.pendingVenuesCount.toLocaleString(), 
      icon: 'pending_actions', 
      path: '/admin/spaces',
      alert: stats.pendingVenuesCount > 0,
    },
    { label: 'Anfitriones', value: stats.providerCount.toLocaleString(), icon: 'storefront', path: '/admin/hosts' },
    { label: 'Usuarios', value: stats.userCount.toLocaleString(), icon: 'people', path: '/admin/users' },
    { label: 'Reservas Hoy', value: stats.todayBookings.toLocaleString(), icon: 'event', path: '/admin/bookings' },
    { label: 'Ingresos (completadas)', value: `$${stats.revenue.toLocaleString()}`, icon: 'payments', path: '/admin/finance' },
  ];

  const quickActions = [
    { 
      label: `Aprobar espacios pendientes ${stats.pendingVenuesCount > 0 ? `(${stats.pendingVenuesCount})` : ''}`, 
      path: '/admin/spaces', 
      icon: 'pending_actions',
      highlight: stats.pendingVenuesCount > 0,
    },
    { label: 'Gestionar categorías', path: '/admin/categories', icon: 'category' },
    { label: 'Ver todas las reservas', path: '/admin/bookings', icon: 'event_note' },
    { label: 'Configuración de plataforma', path: '/admin/settings', icon: 'settings' },
  ];

  return (
    <AdminLayout>
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-8">
        <header className="mb-6 flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-4xl font-bold font-display dark:text-white">Dashboard</h1>
            <p className="text-slate-500 mt-2">Resumen general y control de calidad de la plataforma</p>
          </div>
          {stats.pendingVenuesCount > 0 && (
            <button
              onClick={() => navigate('/admin/spaces')}
              className="bg-amber-500 hover:bg-amber-600 text-white font-bold px-4 py-2.5 rounded-2xl flex items-center gap-2 shadow-md shadow-amber-500/20 text-sm transition-all animate-pulse"
            >
              <span className="material-icons-round text-lg">notification_important</span>
              <span>{stats.pendingVenuesCount} espacios por revisar</span>
            </button>
          )}
        </header>

        <section className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-5 gap-4">
          {cards.map((stat) => (
            <button
              key={stat.label}
              onClick={() => navigate(stat.path)}
              className={`text-left p-6 rounded-3xl shadow-sm border transition-all ${
                stat.alert
                  ? 'bg-amber-50/70 dark:bg-amber-950/20 border-amber-200 dark:border-amber-800/60 hover:border-amber-400'
                  : 'bg-white dark:bg-surface-dark border-slate-100 dark:border-slate-800 hover:border-primary hover:shadow-md'
              }`}
            >
              <div className={`w-12 h-12 rounded-2xl flex items-center justify-center mb-4 ${
                stat.alert ? 'bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300' : 'bg-orange-50 dark:bg-orange-900/20 text-primary'
              }`}>
                <span className="material-icons-round text-2xl">{stat.icon}</span>
              </div>
              <p className="text-[11px] text-slate-500 font-bold uppercase tracking-wider">{stat.label}</p>
              <p className={`text-2xl font-bold mt-1 ${stat.alert ? 'text-amber-700 dark:text-amber-400' : 'dark:text-white'}`}>{stat.value}</p>
            </button>
          ))}
        </section>

        <section className="bg-white dark:bg-surface-dark p-8 rounded-3xl shadow-sm border border-slate-100 dark:border-slate-800">
          <h3 className="text-xl font-bold mb-6 dark:text-white">Acciones rápidas</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {quickActions.map((a) => (
              <button
                key={a.path}
                onClick={() => navigate(a.path)}
                className="flex items-center gap-4 p-5 rounded-2xl bg-slate-50 dark:bg-slate-800 font-bold hover:bg-slate-100 dark:hover:bg-slate-700 transition-all text-left"
              >
                <span className="material-icons-round text-primary">{a.icon}</span>
                <span className="dark:text-white">{a.label}</span>
              </button>
            ))}
          </div>
        </section>

        <section className="bg-white dark:bg-surface-dark p-8 rounded-3xl shadow-sm border border-slate-100 dark:border-slate-800">
          <h3 className="text-xl font-bold mb-2 dark:text-white">Totales globales</h3>
          <p className="text-sm text-slate-500">Reservas totales: <strong className="dark:text-white">{stats.bookingCount.toLocaleString()}</strong></p>
        </section>
      </motion.div>
    </AdminLayout>
  );
};

export default AdminDashboard;
