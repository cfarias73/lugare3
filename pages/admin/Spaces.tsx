import React, { useState, useEffect } from 'react';
import AdminLayout from '../../components/AdminLayout';
import { Skeleton } from '../../components/ui/Skeleton';
import { EmptyState } from '../../components/ui/EmptyState';
import { getPendingVenues, approveVenue, rejectVenue, getAllVenuesAdmin } from '../../src/services/adminService';
import { toast } from 'sonner';

type Tab = 'pending' | 'all';

const statusStyle: Record<string, string> = {
  pending: 'bg-yellow-100 text-yellow-700',
  approved: 'bg-green-100 text-green-700',
  rejected: 'bg-red-100 text-red-700',
};

const Spaces: React.FC = () => {
  const [tab, setTab] = useState<Tab>('pending');
  const [isLoading, setIsLoading] = useState(true);
  const [venues, setVenues] = useState<any[]>([]);

  const fetchVenues = async () => {
    setIsLoading(true);
    try {
      const data = tab === 'pending' ? await getPendingVenues() : await getAllVenuesAdmin();
      setVenues(data || []);
    } catch (e: any) {
      toast.error(e.message || 'Error cargando espacios');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { fetchVenues(); }, [tab]);

  const handleApprove = async (id: string) => {
    try {
      await approveVenue(id);
      toast.success('Espacio aprobado');
      fetchVenues();
    } catch (e: any) {
      toast.error(e.message || 'Error al aprobar');
    }
  };

  const handleReject = async (id: string) => {
    const reason = prompt('Motivo del rechazo (opcional):') || undefined;
    if (reason === null) return;
    try {
      await rejectVenue(id, reason);
      toast.success('Espacio rechazado');
      fetchVenues();
    } catch (e: any) {
      toast.error(e.message || 'Error al rechazar');
    }
  };

  return (
    <AdminLayout>
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <h1 className="text-2xl font-bold dark:text-white">Gestión de Espacios</h1>
        <div className="flex gap-2 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">
          {(['pending', 'all'] as Tab[]).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${
                tab === t ? 'bg-white dark:bg-slate-700 text-primary shadow-sm' : 'text-slate-500'
              }`}
            >
              {t === 'pending' ? 'Pendientes' : 'Todos'}
            </button>
          ))}
        </div>
      </div>

      <div className="bg-white dark:bg-surface-dark rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800 overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-slate-50 dark:bg-slate-800 text-slate-500 dark:text-slate-400 text-xs uppercase tracking-widest">
            <tr>
              <th className="p-4">Nombre</th>
              <th className="p-4">Anfitrión</th>
              {tab === 'all' && <th className="p-4">Estado</th>}
              <th className="p-4">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
            {isLoading ? (
              [1, 2, 3].map((i) => (
                <tr key={i}>
                  <td className="p-4"><Skeleton className="h-4 w-48" /></td>
                  <td className="p-4"><Skeleton className="h-4 w-32" /></td>
                  {tab === 'all' && <td className="p-4"><Skeleton className="h-4 w-16" /></td>}
                  <td className="p-4"><Skeleton className="h-4 w-24" /></td>
                </tr>
              ))
            ) : venues.length === 0 ? (
              <tr>
                <td colSpan={tab === 'all' ? 4 : 3} className="p-8">
                  <EmptyState
                    title={tab === 'pending' ? 'No hay espacios pendientes' : 'No hay espacios'}
                    description="Todo está al día."
                    icon="check_circle"
                  />
                </td>
              </tr>
            ) : (
              venues.map((venue) => (
                <tr key={venue.id} className="text-sm dark:text-slate-300">
                  <td className="p-4 font-medium">{venue.name}</td>
                  <td className="p-4">{venue.profiles?.name || venue.profiles?.email || 'N/A'}</td>
                  {tab === 'all' && (
                    <td className="p-4">
                      <span className={`text-xs font-bold px-2 py-1 rounded-full ${statusStyle[venue.status] || 'bg-slate-100 text-slate-600'}`}>
                        {venue.status}
                      </span>
                    </td>
                  )}
                  <td className="p-4 space-x-3">
                    {venue.status !== 'approved' && (
                      <button
                        onClick={() => handleApprove(venue.id)}
                        className="bg-primary text-white font-bold text-xs px-3 py-1 rounded-full hover:bg-orange-600 transition-all"
                      >
                        Aprobar
                      </button>
                    )}
                    {venue.status !== 'rejected' && (
                      <button
                        onClick={() => handleReject(venue.id)}
                        className="text-red-500 font-bold text-xs hover:underline"
                      >
                        Rechazar
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

export default Spaces;
