import React, { useState, useEffect } from 'react';
import AdminLayout from '../../components/AdminLayout';
import { Skeleton } from '../../components/ui/Skeleton';
import { EmptyState } from '../../components/ui/EmptyState';
import { getPendingVenues, approveVenue } from '../../src/services/adminService';
import { toast } from 'sonner';

const Spaces: React.FC = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [venues, setVenues] = useState<any[]>([]);

  const fetchVenues = async () => {
    setIsLoading(true);
    try {
      const data = await getPendingVenues();
      setVenues(data);
    } catch (e) {
      console.error(e);
      toast.error('Error cargando espacios');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchVenues();
  }, []);

  const handleApprove = async (id: string) => {
    try {
      await approveVenue(id);
      toast.success('Espacio aprobado');
      fetchVenues();
    } catch (e) {
      console.error(e);
      toast.error('Error al aprobar');
    }
  };

  return (
    <AdminLayout>
      <h1 className="text-2xl font-bold mb-6 dark:text-white">Gestión de Espacios (Pendientes)</h1>
      <div className="bg-white dark:bg-surface-dark rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800 overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-slate-50 dark:bg-slate-800 text-slate-500 dark:text-slate-400 text-xs uppercase tracking-widest">
            <tr>
              <th className="p-4">Nombre</th>
              <th className="p-4">Anfitrión</th>
              <th className="p-4">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
            {isLoading ? (
              [1, 2, 3].map((i) => (
                <tr key={i}>
                  <td className="p-4"><Skeleton className="h-4 w-48" /></td>
                  <td className="p-4"><Skeleton className="h-4 w-32" /></td>
                  <td className="p-4"><Skeleton className="h-4 w-16" /></td>
                </tr>
              ))
            ) : venues.length === 0 ? (
              <tr>
                <td colSpan={3} className="p-8">
                  <EmptyState title="No hay espacios pendientes" description="Todo está al día." icon="check_circle" />
                </td>
              </tr>
            ) : (
              venues.map((venue) => (
                <tr key={venue.id} className="text-sm dark:text-slate-300">
                  <td className="p-4 font-medium">{venue.name}</td>
                  <td className="p-4">{venue.profiles?.email || 'N/A'}</td>
                  <td className="p-4">
                    <button 
                      onClick={() => handleApprove(venue.id)}
                      className="bg-primary text-white font-bold text-xs px-3 py-1 rounded-full hover:bg-orange-600 transition-all"
                    >
                      Aprobar
                    </button>
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
