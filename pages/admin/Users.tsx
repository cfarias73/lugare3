import React, { useEffect, useMemo, useState } from 'react';
import AdminLayout from '../../components/AdminLayout';
import { Skeleton } from '../../components/ui/Skeleton';
import { EmptyState } from '../../components/ui/EmptyState';
import ConfirmationDialog from '../../components/ui/ConfirmationDialog';
import { getAllUsers, updateUserName, deleteUserProfile } from '../../src/services/adminService';
import { toast } from 'sonner';

type DateFilter = 'all' | 'today' | 'week' | 'month';

const Users: React.FC = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [users, setUsers] = useState<any[]>([]);
  const [q, setQ] = useState('');
  const [dateFilter, setDateFilter] = useState<DateFilter>('all');
  const [editing, setEditing] = useState<any | null>(null);
  const [editName, setEditName] = useState('');
  const [toDelete, setToDelete] = useState<any | null>(null);

  const load = () => {
    setIsLoading(true);
    getAllUsers()
      .then(setUsers)
      .catch((e) => toast.error(e.message || 'Error cargando usuarios'))
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
    return users.filter((u) => {
      const matchesQ =
        !q ||
        (u.name || '').toLowerCase().includes(q.toLowerCase()) ||
        (u.email || '').toLowerCase().includes(q.toLowerCase());
      if (!matchesQ) return false;
      if (dateFilter === 'all') return true;
      if (!u.created_at) return false;
      return now - new Date(u.created_at).getTime() <= ranges[dateFilter];
    });
  }, [users, q, dateFilter]);

  const handleSaveEdit = async () => {
    if (!editing) return;
    try {
      await updateUserName(editing.id, editName.trim());
      toast.success('Usuario actualizado');
      setEditing(null);
      load();
    } catch (e: any) {
      toast.error(e.message || 'Error al actualizar');
    }
  };

  const handleDelete = async () => {
    if (!toDelete) return;
    try {
      await deleteUserProfile(toDelete.id);
      toast.success('Usuario eliminado');
      load();
    } catch (e: any) {
      toast.error(e.message || 'Error al eliminar');
    }
  };

  return (
    <AdminLayout>
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
        <h1 className="text-2xl font-bold dark:text-white">Gestión de Usuarios ({filtered.length})</h1>
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
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Buscar por nombre o email..."
            className="px-4 py-2 border border-slate-200 dark:border-slate-700 rounded-xl dark:bg-slate-800 dark:text-white text-sm w-72"
          />
        </div>
      </div>
      <div className="bg-white dark:bg-surface-dark rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800 overflow-x-auto">
        <table className="w-full min-w-[760px] text-left">
          <thead className="bg-slate-50 dark:bg-slate-800 text-slate-500 dark:text-slate-400 text-xs uppercase tracking-widest">
            <tr>
              <th className="p-4">Nombre</th>
              <th className="p-4">Email</th>
              <th className="p-4">Tipo de cuenta</th>
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
                  <td className="p-4"><Skeleton className="h-4 w-24" /></td>
                  <td className="p-4"><Skeleton className="h-4 w-24" /></td>
                  <td className="p-4"><Skeleton className="h-4 w-20" /></td>
                </tr>
              ))
            ) : filtered.length === 0 ? (
              <tr>
                <td colSpan={5} className="p-8">
                  <EmptyState title="No hay cuentas" description="No se encontraron usuarios ni administradores con los filtros aplicados." icon="people" />
                </td>
              </tr>
            ) : (
              filtered.map((user) => (
                <tr key={user.id} className="text-sm dark:text-slate-300">
                  <td className="p-4 font-medium">{user.name || '—'}</td>
                  <td className="p-4">{user.email || '—'}</td>
                  <td className="p-4">
                    <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${user.accountRole === 'Administrador' ? 'bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-300' : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300'}`}>
                      {user.accountRole}
                    </span>
                  </td>
                  <td className="p-4 text-slate-500">{user.created_at ? new Date(user.created_at).toLocaleDateString() : '—'}</td>
                  <td className="p-4 text-right">
                    <div className="flex justify-end gap-2">
                      <button
                        onClick={() => { setEditing(user); setEditName(user.name || ''); }}
                        className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300"
                        title="Editar"
                      >
                        <span className="material-icons-round text-base">edit</span>
                      </button>
                      {user.accountRole !== 'Administrador' && (
                        <button
                          onClick={() => setToDelete(user)}
                          className="p-2 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 text-red-500"
                          title="Eliminar"
                        >
                          <span className="material-icons-round text-base">delete</span>
                        </button>
                      )}
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
            <h3 className="text-xl font-bold dark:text-white mb-4 font-display">Editar usuario</h3>
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
        title="Eliminar usuario"
        message={`¿Seguro que deseas eliminar a ${toDelete?.name || toDelete?.email}? Esta acción no se puede deshacer.`}
        confirmText="Eliminar"
      />
    </AdminLayout>
  );
};

export default Users;
