import React, { useState, useEffect } from 'react';
import AdminLayout from '../../components/AdminLayout';
import { Skeleton } from '../../components/ui/Skeleton';
import { motion } from 'motion/react';

const AdminDashboard: React.FC = () => {
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Simulate data fetch
    const timer = setTimeout(() => setIsLoading(false), 1500);
    return () => clearTimeout(timer);
  }, []);

  if (isLoading) {
    return (
      <AdminLayout>
        <h1 className="text-2xl font-bold mb-6 dark:text-white">Dashboard</h1>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {[1, 2, 3, 4].map((i) => <Skeleton key={i} className="h-32 rounded-2xl" />)}
        </div>
        <Skeleton className="h-64 w-full rounded-2xl" />
      </AdminLayout>
    );
  }

  const stats = [
    { label: 'Usuarios', value: '1,284', icon: 'people' },
    { label: 'Anfitriones', value: '342', icon: 'storefront' },
    { label: 'Reservas Hoy', value: '56', icon: 'event' },
    { label: 'Ingresos', value: '$124,500', icon: 'payments' },
  ];

  return (
    <AdminLayout>
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-8"
      >
        <header className="flex justify-between items-center mb-10">
          <h1 className="text-4xl font-bold font-display dark:text-white">Dashboard</h1>
          <button className="bg-primary text-white px-8 py-4 rounded-2xl font-bold shadow-lg shadow-primary/20 hover:bg-orange-600 transition-all">
            Exportar Reporte
          </button>
        </header>

        <section className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-8">
          {stats.map((stat) => (
            <div key={stat.label} className="bg-white dark:bg-surface-dark p-8 rounded-3xl shadow-sm border border-slate-100 dark:border-slate-800">
              <div className="w-16 h-16 bg-orange-50 dark:bg-orange-900/20 rounded-3xl flex items-center justify-center text-primary mb-6">
                <span className="material-icons-round text-3xl">{stat.icon}</span>
              </div>
              <p className="text-sm text-slate-500 font-bold uppercase tracking-widest">{stat.label}</p>
              <p className="text-4xl font-bold dark:text-white mt-2">{stat.value}</p>
            </div>
          ))}
        </section>

        <section className="grid grid-cols-1 xl:grid-cols-3 gap-8">
          <div className="xl:col-span-2 bg-white dark:bg-surface-dark p-10 rounded-3xl shadow-sm border border-slate-100 dark:border-slate-800">
            <h3 className="text-2xl font-bold mb-8 dark:text-white">Actividad Reciente</h3>
            <div className="space-y-6">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="flex items-center justify-between p-6 bg-slate-50 dark:bg-slate-800 rounded-3xl hover:bg-slate-100 transition-colors">
                  <div className="flex items-center gap-6">
                    <div className="w-14 h-14 rounded-full bg-slate-200 dark:bg-slate-700" />
                    <div>
                      <p className="font-bold text-lg dark:text-white">Nuevo usuario registrado</p>
                      <p className="text-sm text-slate-500">Hace 5 minutos · ID: #12345</p>
                    </div>
                  </div>
                  <button className="text-primary font-bold">Ver detalles</button>
                </div>
              ))}
            </div>
          </div>
          <div className="bg-white dark:bg-surface-dark p-10 rounded-3xl shadow-sm border border-slate-100 dark:border-slate-800">
            <h3 className="text-2xl font-bold mb-8 dark:text-white">Acciones Rápidas</h3>
            <div className="space-y-4">
              <button className="w-full text-left p-6 rounded-2xl bg-slate-50 dark:bg-slate-800 font-bold hover:bg-slate-100 dark:hover:bg-slate-700 transition-all">
                Aprobar nuevo anfitrión
              </button>
              <button className="w-full text-left p-6 rounded-2xl bg-slate-50 dark:bg-slate-800 font-bold hover:bg-slate-100 dark:hover:bg-slate-700 transition-all">
                Gestionar disputas pendientes
              </button>
              <button className="w-full text-left p-6 rounded-2xl bg-slate-50 dark:bg-slate-800 font-bold hover:bg-slate-100 dark:hover:bg-slate-700 transition-all">
                Ver reportes financieros
              </button>
            </div>
          </div>
        </section>
      </motion.div>
    </AdminLayout>
  );
};

export default AdminDashboard;
