import React, { useEffect, useMemo, useState } from 'react';
import AdminLayout from '../../components/AdminLayout';
import { Skeleton } from '../../components/ui/Skeleton';
import { EmptyState } from '../../components/ui/EmptyState';
import ConfirmationDialog from '../../components/ui/ConfirmationDialog';
import { getAllHosts, updateHostName, deleteHostProfile } from '../../src/services/adminService';
import { toast } from 'sonner';

type DateFilter = 'all' | 'today' | 'week' | 'month';
type SpacesFilter = 'all' | 'none' | 'one' | 'many';

const Hosts: React.FC = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [hosts, setHosts] = useState<any[]>([]);
  const [q, setQ] = useState('');
  const [dateFilter, setDateFilter] = useState<DateFilter>('all');
  const [spacesFilter, setSpacesFilter] = useState<SpacesFilter>('all');
  const [editing, setEditing] = useState<any | null>(null);
  const [editName, setEditName] = useState('');
  const [toDelete, setToDelete] = useState<any | null>(null);

  const load = () => {
    setIsLoading(true);
    getAllHosts()
      .then(setHosts)
      .catch((e) => toast.error(e.message || 'Error cargando anfitriones'))
      .finally(() => setIsLoading(false));
  };

  useEffect(() => { load(); }, []);

  const filtered = useMemo(() => {
    const now = Date.now();
    const ranges: Record<DateFilter, number> = {
      all: 0,
      today: 24 * 60 * 60 * 1000,
      week: 7 * 24 * 60 * 60 * 1000,
      month: 30 * 24 * 60 * 60 * 1000,
    };
    return hosts.filter((h) => {
      const matchesQ =
        !q ||
        (h.name || '').toLowerCase().includes(q.toLowerCase()) ||
        (h.email || '').toLowerCase().includes(q.toLowerCase());
      if (!matchesQ) return false;
      if (spacesFilter === 'none' && h.spaces !== 0) return false;
      if (spacesFilter === 'one' && h.spaces !== 1) return false;
      if (spacesFilter === 'many' && h.spaces < 2) return false;
      if (dateFilter === 'all') return true;
      if (!h.created_at) return false;
      return now - new Date(h.created_at).getTime() <= ranges[dateFilter];
    });
  }, [hosts, q, dateFilter, spacesFilter]);

  const handleSaveEdit = async () => {
    if (!editing) return;
    try {
      await updateHostName(editing.id, editName.trim());
      toast.success('Anfitrión actualizado');
      setEditing(null);
      load();
    } catch (e: any) {
      toast.error(e.message || 'Error al actualizar');
    }
  };

  const handleDelete = async () => {
    if (!toDelete) return;
    try {
      await deleteHostProfile(toDelete.id);
      toast.success('Anfitrión eliminado');
      load();
    } catch (e: any) {
      toast.error(e.message || 'Error al eliminar');
    }
  };

  return (
    <AdminLayout>
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
        <h1 className="text-2xl font-bold dark:text-white">Gestión de Anfitriones ({filtered.length})</h1>
        <div className="flex flex-wrap gap-2">
          <select
            value={dateFilter}
            onChange={(e) => setDateFilter(e.target.value as DateFilter)}
            className="px-4 py-2 border border-slate-200 dark:border-slate-700 rounded-xl dark:bg-slate-800 dark:text-white text-sm"
          >
            <option value="all">Todas las fechas</option>
            <option value="today">Hoy</option>
            <option value="week">Últimos 7 días</option>
            <option value="month">Últimos 30 días</option>
          </select>
          <select
            value={spacesFilter}
            onChange={(e) => setSpacesFilter(e.target.value as SpacesFilter)}
            className="px-4 py-2 border border-slate-200 dark:border-slate-700 rounded-xl dark:bg-slate-800 dark:text-white text-sm"
          >
            <option value="all">Todos los espacios</option>
            <option value="none">Sin espacios</option>
            <option value="one">1 espacio</option>
            <option value="many">2 o más</option>
          </select>
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Buscar por nombre o email..."
            className="px-4 py-2 border border-slate-200 dark:border-slate-700 rounded-xl dark:bg-slate-800 dark:text-white text-sm w-72"
          />
        </div>
      </div>
      <div className="bg-white dark:bg-surface-dark rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800 overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-slate-50 dark:bg-slate-800 text-slate-500 dark:text-slate-400 text-xs uppercase tracking-widest">
            <tr>
              <th className="p-4">Nombre</th>
              <th className="p-4">Email</th>
              <th className="p-4">Espacios</th>
              <th className="p-4">CLABE / Banco</th>
              <th className="p-4">Fecha de registro</th>
              <th className="p-4 text-right">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
            {isLoading ? (
              [1, 2, 3].map((i) => (
                <tr key={i}>
                  <td className="p-4"><Skeleton className="h-4 w-32" /></td>
                  <td className="p-4"><Skeleton className="h-4 w-48" /></td>
                  <td className="p-4"><Skeleton className="h-4 w-16" /></td>
                  <td className="p-4"><Skeleton className="h-4 w-40" /></td>
                  <td className="p-4"><Skeleton className="h-4 w-24" /></td>
                  <td className="p-4"><Skeleton className="h-4 w-20" /></td>
                </tr>
              ))
            ) : filtered.length === 0 ? (
              <tr>
                <td colSpan={6} className="p-8">
                  <EmptyState title="No hay anfitriones" description="No se encontraron anfitriones con los filtros aplicados." icon="storefront" />
                </td>
              </tr>
            ) : (
              filtered.map((host) => (
                <tr key={host.id} className="text-sm dark:text-slate-300">
                  <td className="p-4 font-medium">{host.name || '—'}</td>
                  <td className="p-4">{host.email}</td>
                  <td className="p-4">{host.spaces}</td>
                  <td className="p-4">
                    {host.clabe ? (
                      <div className="flex flex-col">
                        <button
                          onClick={() => {
                            navigator.clipboard.writeText(host.clabe);
                            toast.success('CLABE copiada');
                          }}
                          className="font-mono text-xs text-slate-700 dark:text-slate-200 hover:text-primary text-left"
                          title="Copiar CLABE"
                        >
                          {host.clabe}
                        </button>
                        <span className="text-[10px] text-slate-400 uppercase tracking-wider">
                          {host.bank_name || 'Sin banco'} {host.account_holder ? `· ${host.account_holder}` : ''}
                        </span>
                      </div>
                    ) : (
                      <span className="text-xs text-slate-400 italic">No registrada</span>
                    )}
                  </td>
                  <td className="p-4 text-slate-500">{host.created_at ? new Date(host.created_at).toLocaleDateString() : '—'}</td>
                  <td className="p-4 text-right">
                    <div className="flex justify-end gap-2">
                      <button
                        onClick={() => { setEditing(host); setEditName(host.name || ''); }}
                        className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300"
                        title="Editar"
                      >
                        <span className="material-icons-round text-base">edit</span>
                      </button>
                      <button
                        onClick={() => setToDelete(host)}
                        className="p-2 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 text-red-500"
                        title="Eliminar"
                      >
                        <span className="material-icons-round text-base">delete</span>
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {editing && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setEditing(null)} />
          <div className="bg-white dark:bg-surface-dark rounded-[32px] p-8 shadow-2xl w-full max-w-sm relative z-10 border border-slate-100 dark:border-slate-800">
            <h3 className="text-xl font-bold dark:text-white mb-4 font-display">Editar anfitrión</h3>
            <label className="block text-xs font-bold text-slate-500 mb-2">Nombre</label>
            <input
              value={editName}
              onChange={(e) => setEditName(e.target.value)}
              className="w-full px-4 py-3 border border-slate-200 dark:border-slate-700 rounded-xl dark:bg-slate-800 dark:text-white mb-6"
            />
            <div className="flex gap-3">
              <button onClick={() => setEditing(null)} className="flex-1 py-3.5 rounded-2xl font-bold text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800">Cancelar</button>
              <button onClick={handleSaveEdit} className="flex-1 py-3.5 rounded-2xl font-bold text-white bg-primary">Guardar</button>
            </div>
          </div>
        </div>
      )}

      <ConfirmationDialog
        isOpen={!!toDelete}
        onClose={() => setToDelete(null)}
        onConfirm={handleDelete}
        title="Eliminar anfitrión"
        message={`¿Seguro que deseas eliminar a ${toDelete?.name || toDelete?.email}? Esta acción no se puede deshacer y afectará sus espacios.`}
        confirmText="Eliminar"
      />
    </AdminLayout>
  );
};

export default Hosts;
