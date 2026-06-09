import React, { useEffect, useState } from 'react';
import AdminLayout from '../../components/AdminLayout';
import { Skeleton } from '../../components/ui/Skeleton';
import { EmptyState } from '../../components/ui/EmptyState';
import { getAllBookings, cancelBooking } from '../../src/services/adminService';
import { toast } from 'sonner';

const statusStyle: Record<string, string> = {
  pending: 'bg-yellow-100 text-yellow-700',
  confirmed: 'bg-blue-100 text-blue-700',
  completed: 'bg-green-100 text-green-700',
  cancelled: 'bg-red-100 text-red-700',
  rejected: 'bg-slate-200 text-slate-600',
};

const Bookings: React.FC = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [items, setItems] = useState<any[]>([]);

  const fetch = async () => {
    setIsLoading(true);
    try {
      setItems(await getAllBookings());
    } catch (e: any) {
      toast.error(e.message || 'Error cargando reservas');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { fetch(); }, []);

  const handleCancel = async (id: string) => {
    if (!confirm('¿Cancelar esta reserva? Se notificará al usuario.')) return;
    try {
      await cancelBooking(id);
      toast.success('Reserva cancelada');
      fetch();
    } catch (e: any) {
      toast.error(e.message || 'Error al cancelar');
    }
  };

  return (
    <AdminLayout>
      <h1 className="text-2xl font-bold mb-6 dark:text-white">Gestión de Reservas ({items.length})</h1>
      <div className="bg-white dark:bg-surface-dark rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800 overflow-x-auto">
        <table className="w-full text-left">
          <thead className="bg-slate-50 dark:bg-slate-800 text-slate-500 dark:text-slate-400 text-xs uppercase tracking-widest">
            <tr>
              <th className="p-4">Espacio</th>
              <th className="p-4">Usuario</th>
              <th className="p-4">Fecha</th>
              <th className="p-4">Total</th>
              <th className="p-4">Estado</th>
              <th className="p-4">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
            {isLoading ? (
              [1, 2, 3].map((i) => (
                <tr key={i}>
                  {Array.from({ length: 6 }).map((_, j) => (
                    <td key={j} className="p-4"><Skeleton className="h-4 w-20" /></td>
                  ))}
                </tr>
              ))
            ) : items.length === 0 ? (
              <tr>
                <td colSpan={6} className="p-8">
                  <EmptyState title="No hay reservas" description="Aún no hay reservas registradas." icon="event" />
                </td>
              </tr>
            ) : (
              items.map((b) => (
                <tr key={b.id} className="text-sm dark:text-slate-300">
                  <td className="p-4 font-medium">{b.venues?.name || '—'}</td>
                  <td className="p-4">{b.profiles?.name || b.profiles?.email || '—'}</td>
                  <td className="p-4">{b.event_date}</td>
                  <td className="p-4">${Number(b.total_price || 0).toLocaleString()}</td>
                  <td className="p-4">
                    <span className={`text-xs font-bold px-2 py-1 rounded-full ${statusStyle[b.status] || 'bg-slate-100 text-slate-600'}`}>
                      {b.status}
                    </span>
                  </td>
                  <td className="p-4">
                    {b.status !== 'cancelled' && b.status !== 'completed' && (
                      <button onClick={() => handleCancel(b.id)} className="text-red-500 font-bold text-xs hover:underline">
                        Cancelar
                      </button>
                    )}
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
