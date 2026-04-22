import React, { useState, useEffect } from 'react';
import AdminLayout from '../../components/AdminLayout';
import { Skeleton } from '../../components/ui/Skeleton';
import { EmptyState } from '../../components/ui/EmptyState';
import { MOCK_BOOKINGS } from '../../constants';

const Bookings: React.FC = () => {
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => setIsLoading(false), 1000);
    return () => clearTimeout(timer);
  }, []);

  return (
    <AdminLayout>
      <h1 className="text-2xl font-bold mb-6 dark:text-white">Gestión de Reservas</h1>
      <div className="bg-white dark:bg-surface-dark rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800 overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-slate-50 dark:bg-slate-800 text-slate-500 dark:text-slate-400 text-xs uppercase tracking-widest">
            <tr>
              <th className="p-4">ID</th>
              <th className="p-4">Espacio</th>
              <th className="p-4">Fecha</th>
              <th className="p-4">Estado</th>
              <th className="p-4">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
            {isLoading ? (
              [1, 2, 3].map((i) => (
                <tr key={i}>
                  <td className="p-4"><Skeleton className="h-4 w-16" /></td>
                  <td className="p-4"><Skeleton className="h-4 w-32" /></td>
                  <td className="p-4"><Skeleton className="h-4 w-24" /></td>
                  <td className="p-4"><Skeleton className="h-4 w-20" /></td>
                  <td className="p-4"><Skeleton className="h-4 w-16" /></td>
                </tr>
              ))
            ) : MOCK_BOOKINGS.length === 0 ? (
              <tr>
                <td colSpan={5} className="p-8">
                  <EmptyState title="No hay reservas" description="Aún no hay reservas registradas en la plataforma." icon="event" />
                </td>
              </tr>
            ) : (
              MOCK_BOOKINGS.map((booking) => (
                <tr key={booking.id} className="text-sm dark:text-slate-300">
                  <td className="p-4">{booking.id}</td>
                  <td className="p-4">{booking.venueName}</td>
                  <td className="p-4">{booking.date}</td>
                  <td className="p-4">
                    <span style={{ color: booking.statusColor }} className="font-bold">{booking.status}</span>
                  </td>
                  <td className="p-4">
                    <button className="text-red-500 font-bold text-xs hover:underline">Cancelar</button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </AdminLayout>
  );
};

export default Bookings;
