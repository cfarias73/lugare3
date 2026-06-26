import React, { useEffect, useMemo, useState } from 'react';
import AdminLayout from '../../components/AdminLayout';
import { Skeleton } from '../../components/ui/Skeleton';
import { EmptyState } from '../../components/ui/EmptyState';
import { toast } from 'sonner';
import {
  getAllReviews,
  updateReview,
  deleteReview,
} from '../../src/services/adminService';

type Review = {
  id: string;
  rating: number;
  comment: string | null;
  created_at: string;
  venue_id: string;
  user_id: string;
  venues?: { name?: string } | null;
  profiles?: { name?: string } | null;
};

const Reviews: React.FC = () => {
  const [items, setItems] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editRating, setEditRating] = useState(5);
  const [editComment, setEditComment] = useState('');
  const [saving, setSaving] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const data = await getAllReviews();
      setItems(data as Review[]);
    } catch (e: any) {
      toast.error(e.message || 'Error cargando reseñas');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const filtered = useMemo(() => {
    const term = q.trim().toLowerCase();
    if (!term) return items;
    return items.filter(
      (r) =>
        (r.comment || '').toLowerCase().includes(term) ||
        (r.venues?.name || '').toLowerCase().includes(term) ||
        (r.profiles?.name || '').toLowerCase().includes(term)
    );
  }, [items, q]);

  const startEdit = (r: Review) => {
    setEditingId(r.id);
    setEditRating(r.rating);
    setEditComment(r.comment || '');
  };

  const handleSave = async () => {
    if (!editingId) return;
    setSaving(true);
    try {
      await updateReview(editingId, { rating: editRating, comment: editComment });
      toast.success('Reseña actualizada');
      setEditingId(null);
      load();
    } catch (e: any) {
      toast.error(e.message || 'Error guardando');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('¿Eliminar esta reseña?')) return;
    try {
      await deleteReview(id);
      toast.success('Reseña eliminada');
      load();
    } catch (e: any) {
      toast.error(e.message || 'Error eliminando');
    }
  };

  return (
    <AdminLayout>
      <div className="flex items-center justify-between mb-6 gap-4 flex-wrap">
        <h1 className="text-2xl font-bold dark:text-white">Reseñas</h1>
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Buscar por comentario, espacio o usuario..."
          className="px-4 py-2 border border-slate-200 dark:border-slate-700 rounded-xl dark:bg-slate-800 dark:text-white text-sm w-full md:w-80"
        />
      </div>

      <div className="bg-white dark:bg-surface-dark rounded-2xl border border-slate-100 dark:border-slate-800 overflow-x-auto">
        <table className="w-full text-left min-w-[720px]">
          <thead className="bg-slate-50 dark:bg-slate-800 text-slate-500 dark:text-slate-400 text-xs uppercase tracking-widest">
            <tr>
              <th className="p-4">Espacio</th>
              <th className="p-4">Usuario</th>
              <th className="p-4">Rating</th>
              <th className="p-4">Comentario</th>
              <th className="p-4">Fecha</th>
              <th className="p-4">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
            {loading ? (
              [1, 2, 3].map((i) => (
                <tr key={i}>
                  {Array.from({ length: 6 }).map((_, j) => (
                    <td key={j} className="p-4"><Skeleton className="h-4 w-24" /></td>
                  ))}
                </tr>
              ))
            ) : filtered.length === 0 ? (
              <tr>
                <td colSpan={6} className="p-8">
                  <EmptyState
                    title="No hay reseñas"
                    description="Aún no se registran reseñas con los criterios actuales."
                    icon="star"
                  />
                </td>
              </tr>
            ) : (
              filtered.map((r) => (
                <tr key={r.id} className="text-sm dark:text-slate-300 align-top">
                  <td className="p-4 font-bold">{r.venues?.name || '—'}</td>
                  <td className="p-4">{r.profiles?.name || '—'}</td>
                  <td className="p-4">
                    {editingId === r.id ? (
                      <select
                        value={editRating}
                        onChange={(e) => setEditRating(Number(e.target.value))}
                        className="px-2 py-1 border border-slate-200 dark:border-slate-700 rounded-lg dark:bg-slate-800 dark:text-white"
                      >
                        {[1, 2, 3, 4, 5].map((n) => (
                          <option key={n} value={n}>{n} ★</option>
                        ))}
                      </select>
                    ) : (
                      <span className="text-amber-500 font-bold">{r.rating} ★</span>
                    )}
                  </td>
                  <td className="p-4 max-w-md">
                    {editingId === r.id ? (
                      <textarea
                        value={editComment}
                        onChange={(e) => setEditComment(e.target.value)}
                        rows={3}
                        className="w-full px-2 py-1 border border-slate-200 dark:border-slate-700 rounded-lg dark:bg-slate-800 dark:text-white"
                      />
                    ) : (
                      <p className="text-slate-600 dark:text-slate-300 line-clamp-3">
                        {r.comment || <span className="text-slate-400 italic">Sin comentario</span>}
                      </p>
                    )}
                  </td>
                  <td className="p-4 text-slate-500 whitespace-nowrap">
                    {new Date(r.created_at).toLocaleDateString()}
                  </td>
                  <td className="p-4 space-x-3 whitespace-nowrap">
                    {editingId === r.id ? (
                      <>
                        <button
                          onClick={handleSave}
                          disabled={saving}
                          className="text-primary font-bold text-xs hover:underline disabled:opacity-50"
                        >
                          {saving ? 'Guardando...' : 'Guardar'}
                        </button>
                        <button
                          onClick={() => setEditingId(null)}
                          className="text-slate-500 font-bold text-xs hover:underline"
                        >
                          Cancelar
                        </button>
                      </>
                    ) : (
                      <>
                        <button
                          onClick={() => startEdit(r)}
                          className="text-primary font-bold text-xs hover:underline"
                        >
                          Editar
                        </button>
                        <button
                          onClick={() => handleDelete(r.id)}
                          className="text-red-500 font-bold text-xs hover:underline"
                        >
                          Eliminar
                        </button>
                      </>
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

export default Reviews;
