import React, { useEffect, useState } from 'react';
import AdminLayout from '../../components/AdminLayout';
import { Skeleton } from '../../components/ui/Skeleton';
import { EmptyState } from '../../components/ui/EmptyState';
import { toast } from 'sonner';
import {
  Category,
  getAllCategories,
  getCategoryVenueCounts,
  createCategory,
  updateCategory,
  deleteCategory,
} from '../../src/services/categoryService';

const emptyForm = { slug: '', name: '', icon: 'category', sort_order: 0, is_active: true };

const AVAILABLE_ICONS = [
  'category', 'meeting_room', 'celebration', 'work', 'restaurant', 'spa',
  'business_center', 'groups', 'cake', 'local_bar', 'nightlife', 'deck',
  'roofing', 'villa', 'house', 'cottage', 'apartment', 'hotel',
  'pool', 'beach_access', 'park', 'forest', 'yard', 'nature',
  'theater_comedy', 'mic', 'music_note', 'sports_esports', 'sports_bar',
  'church', 'temple_buddhist', 'casino', 'museum', 'school', 'auto_stories',
  'photo_camera', 'movie', 'palette', 'brush', 'self_improvement',
  'fitness_center', 'sports_soccer', 'directions_boat', 'flight',
  'cafe', 'lunch_dining', 'dinner_dining', 'wine_bar', 'liquor',
];

const Categories: React.FC = () => {
  const [items, setItems] = useState<Category[]>([]);
  const [counts, setCounts] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<Omit<Category, 'id'>>(emptyForm);
  const [saving, setSaving] = useState(false);

  const fetch = async () => {
    setLoading(true);
    try {
      const [categories, venueCounts] = await Promise.all([
        getAllCategories(),
        getCategoryVenueCounts(),
      ]);
      setItems(categories);
      setCounts(venueCounts);
    } catch (e: any) {
      toast.error(e.message || 'Error cargando categorías');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetch();
  }, []);

  const startEdit = (c: Category) => {
    setEditingId(c.id);
    setForm({
      slug: c.slug,
      name: c.name,
      icon: c.icon,
      sort_order: c.sort_order,
      is_active: c.is_active,
    });
  };

  const resetForm = () => {
    setEditingId(null);
    setForm(emptyForm);
  };

  const handleSave = async () => {
    if (!form.slug.trim() || !form.name.trim()) {
      toast.error('Slug y nombre son requeridos');
      return;
    }
    setSaving(true);
    try {
      if (editingId) {
        await updateCategory(editingId, form);
        toast.success('Categoría actualizada');
      } else {
        await createCategory(form);
        toast.success('Categoría creada');
      }
      resetForm();
      fetch();
    } catch (e: any) {
      toast.error(e.message || 'Error guardando');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('¿Eliminar esta categoría? Los espacios asignados quedarán sin categoría.')) return;
    try {
      await deleteCategory(id);
      toast.success('Categoría eliminada');
      fetch();
    } catch (e: any) {
      toast.error(e.message || 'Error eliminando');
    }
  };

  return (
    <AdminLayout>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold dark:text-white">Categorías</h1>
      </div>

      <div className="grid md:grid-cols-3 gap-6">
        <div className="md:col-span-1 bg-white dark:bg-surface-dark border border-slate-100 dark:border-slate-800 rounded-2xl p-6 space-y-3 h-fit">
          <h2 className="font-bold dark:text-white">{editingId ? 'Editar categoría' : 'Nueva categoría'}</h2>

          <div>
            <label className="text-xs font-bold text-slate-400 uppercase">Slug</label>
            <input
              value={form.slug}
              onChange={(e) => setForm({ ...form, slug: e.target.value.toLowerCase().replace(/\s+/g, '-') })}
              placeholder="salones"
              className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-lg dark:bg-slate-800 dark:text-white"
            />
          </div>
          <div>
            <label className="text-xs font-bold text-slate-400 uppercase">Nombre</label>
            <input
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="Salones"
              className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-lg dark:bg-slate-800 dark:text-white"
            />
          </div>
          <div>
            <label className="text-xs font-bold text-slate-400 uppercase">
              Icono (Material Icons)
            </label>
            <input
              value={form.icon}
              onChange={(e) => setForm({ ...form, icon: e.target.value })}
              placeholder="meeting_room"
              className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-lg dark:bg-slate-800 dark:text-white"
            />
            <p className="text-[10px] text-slate-400 mt-1">
              Escribe un nombre o selecciona uno de la lista
            </p>
            <div className="mt-2 grid grid-cols-8 gap-1 max-h-40 overflow-y-auto p-2 border border-slate-200 dark:border-slate-700 rounded-lg">
              {AVAILABLE_ICONS.map((ic) => (
                <button
                  key={ic}
                  type="button"
                  onClick={() => setForm({ ...form, icon: ic })}
                  title={ic}
                  className={`flex items-center justify-center aspect-square rounded-md transition ${
                    form.icon === ic
                      ? 'bg-primary text-white'
                      : 'hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300'
                  }`}
                >
                  <span className="material-icons-outlined text-base">{ic}</span>
                </button>
              ))}
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-bold text-slate-400 uppercase">Orden</label>
              <input
                type="number"
                value={form.sort_order}
                onChange={(e) => setForm({ ...form, sort_order: Number(e.target.value) })}
                className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-lg dark:bg-slate-800 dark:text-white"
              />
            </div>
            <label className="flex items-end gap-2 pb-2">
              <input
                type="checkbox"
                checked={form.is_active}
                onChange={(e) => setForm({ ...form, is_active: e.target.checked })}
                className="accent-primary w-5 h-5"
              />
              <span className="text-sm dark:text-white">Activa</span>
            </label>
          </div>

          <div className="flex gap-2 pt-2">
            <button
              onClick={handleSave}
              disabled={saving}
              className="flex-1 bg-primary text-white font-bold py-2.5 rounded-xl disabled:opacity-50"
            >
              {saving ? 'Guardando...' : editingId ? 'Actualizar' : 'Crear'}
            </button>
            {editingId && (
              <button
                onClick={resetForm}
                className="px-4 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-bold dark:text-white"
              >
                Cancelar
              </button>
            )}
          </div>
        </div>

        <div className="md:col-span-2 bg-white dark:bg-surface-dark rounded-2xl border border-slate-100 dark:border-slate-800 overflow-x-auto">
          <table className="w-full text-left min-w-[640px]">
            <thead className="bg-slate-50 dark:bg-slate-800 text-slate-500 dark:text-slate-400 text-xs uppercase tracking-widest">
              <tr>
                <th className="p-4">Icono</th>
                <th className="p-4">Nombre</th>
                <th className="p-4">Slug</th>
                <th className="p-4">Espacios</th>
                <th className="p-4">Orden</th>
                <th className="p-4">Estado</th>
                <th className="p-4">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {loading ? (
                [1, 2, 3].map((i) => (
                  <tr key={i}>
                    {Array.from({ length: 7 }).map((_, j) => (
                      <td key={j} className="p-4">
                        <Skeleton className="h-4 w-20" />
                      </td>
                    ))}
                  </tr>
                ))
              ) : items.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-8">
                    <EmptyState
                      title="No hay categorías"
                      description="Crea la primera categoría desde el formulario."
                      icon="category"
                    />
                  </td>
                </tr>
              ) : (
                items.map((c) => (
                  <tr key={c.id} className="text-sm dark:text-slate-300">
                    <td className="p-4">
                      <span className="material-icons-outlined text-primary">{c.icon}</span>
                    </td>
                    <td className="p-4 font-bold">{c.name}</td>
                    <td className="p-4 text-slate-500">{c.slug}</td>
                    <td className="p-4">
                      <span className="inline-flex items-center justify-center min-w-[2rem] px-2.5 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-bold">
                        {counts[c.slug] || 0}
                      </span>
                    </td>
                    <td className="p-4">{c.sort_order}</td>
                    <td className="p-4">
                      <span
                        className={`text-xs font-bold px-2 py-1 rounded-full ${
                          c.is_active
                            ? 'bg-green-100 text-green-700'
                            : 'bg-slate-100 text-slate-500'
                        }`}
                      >
                        {c.is_active ? 'Activa' : 'Inactiva'}
                      </span>
                    </td>
                    <td className="p-4 space-x-3">
                      <button
                        onClick={() => startEdit(c)}
                        className="text-primary font-bold text-xs hover:underline"
                      >
                        Editar
                      </button>
                      <button
                        onClick={() => handleDelete(c.id)}
                        className="text-red-500 font-bold text-xs hover:underline"
                      >
                        Eliminar
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </AdminLayout>
  );
};

export default Categories;
