import React, { useEffect, useMemo, useState } from 'react';
import AdminLayout from '../../components/AdminLayout';
import { Skeleton } from '../../components/ui/Skeleton';
import { EmptyState } from '../../components/ui/EmptyState';
import { getPendingVenues, approveVenue, rejectVenue, getAllVenuesAdmin } from '../../src/services/adminService';
import { toast } from 'sonner';

type StatusFilter = 'all' | 'pending' | 'approved' | 'rejected';
type DateFilter = 'all' | 'today' | 'week' | 'month';

const statusStyle: Record<string, string> = {
  pending: 'bg-yellow-100 text-yellow-700',
  approved: 'bg-green-100 text-green-700',
  rejected: 'bg-red-100 text-red-700',
};

const statusLabel: Record<string, string> = {
  pending: 'Pendiente',
  approved: 'Aprobado',
  rejected: 'Rechazado',
};

const formatCategory = (slug?: string) => {
  if (!slug) return '—';
  return slug.replace(/-/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase());
};

const Spaces: React.FC = () => {
  const [tab, setTab] = useState<StatusFilter>('pending');
  const [isLoading, setIsLoading] = useState(true);
  const [venues, setVenues] = useState<any[]>([]);
  const [q, setQ] = useState('');
  const [dateFilter, setDateFilter] = useState<DateFilter>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [cityFilter, setCityFilter] = useState<string>('all');

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

  const categories = useMemo(
    () => Array.from(new Set(venues.map((v) => v.category).filter(Boolean))).sort(),
    [venues]
  );

  const cities = useMemo(
    () => Array.from(new Set(venues.map((v) => v.city).filter(Boolean))).sort(),
    [venues]
  );

  const filtered = useMemo(() => {
    const now = Date.now();
    const ranges: Record<DateFilter, number> = {
      all: 0,
      today: 24 * 60 * 60 * 1000,
      week: 7 * 24 * 60 * 60 * 1000,
      month: 30 * 24 * 60 * 60 * 1000,
    };
    return venues.filter((venue) => {
      const matchesQ =
        !q ||
        (venue.name || '').toLowerCase().includes(q.toLowerCase()) ||
        (venue.profiles?.name || '').toLowerCase().includes(q.toLowerCase()) ||
        (venue.profiles?.email || '').toLowerCase().includes(q.toLowerCase());
      if (!matchesQ) return false;
      if (tab !== 'all' && venue.status !== tab) return false;
      if (categoryFilter !== 'all' && venue.category !== categoryFilter) return false;
      if (cityFilter !== 'all' && venue.city !== cityFilter) return false;
      if (dateFilter === 'all') return true;
      if (!venue.created_at) return false;
      return now - new Date(venue.created_at).getTime() <= ranges[dateFilter];
    });
  }, [venues, q, tab, dateFilter, categoryFilter, cityFilter]);

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
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
        <h1 className="text-2xl font-bold dark:text-white">Gestión de Espacios ({filtered.length})</h1>
      </div>

      <div className="flex flex-wrap items-center gap-3 mb-6">
        <div className="flex gap-2 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">
          {(['pending', 'approved', 'rejected', 'all'] as StatusFilter[]).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${
                tab === t ? 'bg-white dark:bg-slate-700 text-primary shadow-sm' : 'text-slate-500'
              }`}
            >
              {t === 'pending' && 'Pendientes'}
              {t === 'approved' && 'Aprobados'}
              {t === 'rejected' && 'Rechazados'}
              {t === 'all' && 'Todos'}
            </button>
          ))}
        </div>
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
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
          className="px-4 py-2 border border-slate-200 dark:border-slate-700 rounded-xl dark:bg-slate-800 dark:text-white text-sm"
        >
          <option value="all">Todas las categorías</option>
          {categories.map((c) => (
            <option key={c} value={c}>{formatCategory(c)}</option>
          ))}
        </select>
        <select
          value={cityFilter}
          onChange={(e) => setCityFilter(e.target.value)}
          className="px-4 py-2 border border-slate-200 dark:border-slate-700 rounded-xl dark:bg-slate-800 dark:text-white text-sm"
        >
          <option value="all">Todas las ciudades</option>
          {cities.map((c) => (
            <option key={c} value={c}>{c}</option>
          ))}
        </select>
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Buscar espacio o anfitrión..."
          className="px-4 py-2 border border-slate-200 dark:border-slate-700 rounded-xl dark:bg-slate-800 dark:text-white text-sm w-full md:w-72"
        />
      </div>

      <div className="md:hidden space-y-3">
        {isLoading ? (
          [1, 2, 3].map((i) => (
            <div key={i} className="rounded-2xl bg-white dark:bg-surface-dark border border-slate-100 dark:border-slate-800 p-5 space-y-3">
              <Skeleton className="h-5 w-2/3" />
              <Skeleton className="h-4 w-1/2" />
              <Skeleton className="h-4 w-1/3" />
            </div>
          ))
        ) : filtered.length === 0 ? (
          <div className="rounded-2xl bg-white dark:bg-surface-dark border border-slate-100 dark:border-slate-800 p-6">
            <EmptyState
              title={tab === 'pending' ? 'No hay espacios pendientes' : 'No hay espacios'}
              description="No se encontraron espacios con los filtros aplicados."
              icon="check_circle"
            />
          </div>
        ) : (
          filtered.map((venue) => (
            <article key={venue.id} className="rounded-2xl bg-white dark:bg-surface-dark border border-slate-100 dark:border-slate-800 p-5 shadow-sm">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <h2 className="font-bold text-slate-800 dark:text-white break-words">{venue.name}</h2>
                  <p className="mt-1 text-sm text-slate-500">{venue.profiles?.name || venue.profiles?.email || 'Anfitrión sin nombre'}</p>
                </div>
                <span className={`shrink-0 text-[10px] font-bold px-2 py-1 rounded-full ${statusStyle[venue.status] || 'bg-slate-100 text-slate-600'}`}>
                  {statusLabel[venue.status] || venue.status}
                </span>
              </div>
              <div className="mt-3 flex flex-wrap gap-x-3 gap-y-1 text-xs text-slate-500">
                <span>{formatCategory(venue.category)}</span>
                <span>{venue.city || 'Ciudad no indicada'}</span>
                <span>{venue.created_at ? new Date(venue.created_at).toLocaleDateString() : '—'}</span>
              </div>
              <div className="mt-4 flex gap-3 border-t border-slate-100 dark:border-slate-800 pt-4">
                {venue.status !== 'approved' && (
                  <button
                    onClick={() => handleApprove(venue.id)}
                    className="flex-1 rounded-xl bg-primary px-4 py-3 text-sm font-bold text-white hover:bg-orange-600 transition-colors"
                  >
                    Aprobar
                  </button>
                )}
                {venue.status !== 'rejected' && (
                  <button
                    onClick={() => handleReject(venue.id)}
                    className="flex-1 rounded-xl border border-red-200 px-4 py-3 text-sm font-bold text-red-600 hover:bg-red-50 dark:border-red-900 dark:hover:bg-red-900/20 transition-colors"
                  >
                    Rechazar
                  </button>
                )}
              </div>
            </article>
          ))
        )}
      </div>

      <div className="hidden md:block bg-white dark:bg-surface-dark rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800 overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-slate-50 dark:bg-slate-800 text-slate-500 dark:text-slate-400 text-xs uppercase tracking-widest">
            <tr>
              <th className="p-4">Nombre</th>
              <th className="p-4">Anfitrión</th>
              <th className="p-4">Categoría</th>
              <th className="p-4">Ciudad</th>
              <th className="p-4">Estado</th>
              <th className="p-4">Registro</th>
              <th className="p-4">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
            {isLoading ? (
              [1, 2, 3].map((i) => (
                <tr key={i}>
                  <td className="p-4"><Skeleton className="h-4 w-40" /></td>
                  <td className="p-4"><Skeleton className="h-4 w-32" /></td>
                  <td className="p-4"><Skeleton className="h-4 w-24" /></td>
                  <td className="p-4"><Skeleton className="h-4 w-24" /></td>
                  <td className="p-4"><Skeleton className="h-4 w-16" /></td>
                  <td className="p-4"><Skeleton className="h-4 w-20" /></td>
                  <td className="p-4"><Skeleton className="h-4 w-24" /></td>
                </tr>
              ))
            ) : filtered.length === 0 ? (
              <tr>
                <td colSpan={7} className="p-8">
                  <EmptyState
                    title={tab === 'pending' ? 'No hay espacios pendientes' : 'No hay espacios'}
                    description="No se encontraron espacios con los filtros aplicados."
                    icon="check_circle"
                  />
                </td>
              </tr>
            ) : (
              filtered.map((venue) => (
                <tr key={venue.id} className="text-sm dark:text-slate-300">
                  <td className="p-4 font-medium">{venue.name}</td>
                  <td className="p-4">{venue.profiles?.name || venue.profiles?.email || 'N/A'}</td>
                  <td className="p-4">{formatCategory(venue.category)}</td>
                  <td className="p-4">{venue.city || '—'}</td>
                  <td className="p-4">
                    <span className={`text-xs font-bold px-2 py-1 rounded-full ${statusStyle[venue.status] || 'bg-slate-100 text-slate-600'}`}>
                      {statusLabel[venue.status] || venue.status}
                    </span>
                  </td>
                  <td className="p-4 text-slate-500">
                    {venue.created_at ? new Date(venue.created_at).toLocaleDateString() : '—'}
                  </td>
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
