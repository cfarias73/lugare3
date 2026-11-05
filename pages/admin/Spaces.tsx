import React, { useEffect, useMemo, useState } from 'react';
import AdminLayout from '../../components/AdminLayout';
import { Skeleton } from '../../components/ui/Skeleton';
import { EmptyState } from '../../components/ui/EmptyState';
import { getPendingVenues, approveVenue, rejectVenue, getAllVenuesAdmin } from '../../src/services/adminService';
import { toast } from 'sonner';

type StatusFilter = 'all' | 'pending' | 'approved' | 'rejected';
type DateFilter = 'all' | 'today' | 'week' | 'month';

const statusStyle: Record<string, string> = {
  pending: 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300 border border-amber-200 dark:border-amber-800',
  approved: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800',
  rejected: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300 border border-red-200 dark:border-red-800',
};

const statusLabel: Record<string, string> = {
  pending: 'Pendiente de aprobación',
  approved: 'Aprobado y público',
  rejected: 'Rechazado',
};

const formatCategory = (slug?: string) => {
  if (!slug) return '—';
  return slug.replace(/-/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase());
};

const REJECTION_PRESETS = [
  'Las fotografías son de baja calidad, oscuras o insuficientes.',
  'La descripción del espacio es muy breve o carece de información esencial.',
  'Los precios, capacidades u horarios presentan inconsistencias.',
  'La dirección o ubicación proporcionada no es válida o está incompleta.',
  'El espacio no cumple con los estándares mínimos requeridos por Lugare.',
];

const FALLBACK_IMG = 'https://images.unsplash.com/photo-1519167758481-83f5e181dcc3?auto=format&fit=crop&q=80&w=800';

const Spaces: React.FC = () => {
  const [tab, setTab] = useState<StatusFilter>('pending');
  const [isLoading, setIsLoading] = useState(true);
  const [venues, setVenues] = useState<any[]>([]);
  const [q, setQ] = useState('');
  const [dateFilter, setDateFilter] = useState<DateFilter>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [cityFilter, setCityFilter] = useState<string>('all');

  // Modal inspection & rejection states
  const [inspectVenue, setInspectVenue] = useState<any | null>(null);
  const [rejectVenueTarget, setRejectVenueTarget] = useState<any | null>(null);
  const [rejectReason, setRejectReason] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedPhotoIndex, setSelectedPhotoIndex] = useState(0);

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

  useEffect(() => { 
    fetchVenues(); 
  }, [tab]);

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
    setIsSubmitting(true);
    try {
      await approveVenue(id);
      toast.success('Espacio aprobado exitosamente');
      if (inspectVenue?.id === id) {
        setInspectVenue((prev: any) => prev ? { ...prev, status: 'approved', rejection_reason: null } : null);
      }
      fetchVenues();
    } catch (e: any) {
      toast.error(e.message || 'Error al aprobar');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleOpenReject = (venue: any) => {
    setRejectVenueTarget(venue);
    setRejectReason('');
  };

  const handleConfirmReject = async () => {
    if (!rejectVenueTarget) return;
    setIsSubmitting(true);
    try {
      await rejectVenue(rejectVenueTarget.id, rejectReason.trim());
      toast.success('Espacio rechazado y anfitrión notificado');
      if (inspectVenue?.id === rejectVenueTarget.id) {
        setInspectVenue((prev: any) => prev ? { ...prev, status: 'rejected', rejection_reason: rejectReason.trim() } : null);
      }
      setRejectVenueTarget(null);
      setRejectReason('');
      fetchVenues();
    } catch (e: any) {
      toast.error(e.message || 'Error al rechazar');
    } finally {
      setIsSubmitting(false);
    }
  };

  const openInspector = (venue: any) => {
    setInspectVenue(venue);
    setSelectedPhotoIndex(0);
  };

  return (
    <AdminLayout>
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold dark:text-white">Control de Calidad y Aprobación de Espacios</h1>
          <p className="text-sm text-slate-500 mt-1">Revisa las fotografías, tarifas y estándares antes de hacer público cada negocio.</p>
        </div>
      </div>

      {/* Tabs & Filters */}
      <div className="flex flex-wrap items-center gap-3 mb-6">
        <div className="flex gap-2 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">
          {(['pending', 'approved', 'rejected', 'all'] as StatusFilter[]).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`px-4 py-2 rounded-lg text-sm font-bold transition-all flex items-center gap-2 ${
                tab === t ? 'bg-white dark:bg-slate-700 text-primary shadow-sm' : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              <span>
                {t === 'pending' && 'Pendientes de aprobación'}
                {t === 'approved' && 'Aprobados'}
                {t === 'rejected' && 'Rechazados'}
                {t === 'all' && 'Todos'}
              </span>
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

      {/* Mobile list */}
      <div className="md:hidden space-y-4">
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
          filtered.map((venue) => {
            const thumb = venue.venue_images?.[0]?.image_url || FALLBACK_IMG;
            return (
              <article key={venue.id} className="rounded-2xl bg-white dark:bg-surface-dark border border-slate-100 dark:border-slate-800 p-4 shadow-sm space-y-3">
                <div className="flex gap-3">
                  <img src={thumb} alt={venue.name} className="w-20 h-20 rounded-xl object-cover border border-slate-100" />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-2">
                      <h2 className="font-bold text-slate-800 dark:text-white text-sm break-words">{venue.name}</h2>
                      <span className={`shrink-0 text-[10px] font-bold px-2 py-0.5 rounded-full ${statusStyle[venue.status] || 'bg-slate-100 text-slate-600'}`}>
                        {statusLabel[venue.status] || venue.status}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 mt-0.5">{venue.profiles?.name || venue.profiles?.email || 'Anfitrión'}</p>
                    <p className="text-xs text-slate-400 mt-1">{venue.city || 'Ciudad no indicada'} • {formatCategory(venue.category)}</p>
                  </div>
                </div>

                <div className="flex gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                  <button
                    onClick={() => openInspector(venue)}
                    className="flex-1 rounded-xl bg-slate-100 dark:bg-slate-800 px-3 py-2 text-xs font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-200 transition-colors flex items-center justify-center gap-1"
                  >
                    <span className="material-icons-round text-base">visibility</span>
                    Inspeccionar
                  </button>
                  {venue.status !== 'approved' && (
                    <button
                      onClick={() => handleApprove(venue.id)}
                      disabled={isSubmitting}
                      className="rounded-xl bg-emerald-600 px-3 py-2 text-xs font-bold text-white hover:bg-emerald-700 transition-colors"
                    >
                      Aprobar
                    </button>
                  )}
                  {venue.status !== 'rejected' && (
                    <button
                      onClick={() => handleOpenReject(venue)}
                      disabled={isSubmitting}
                      className="rounded-xl border border-red-200 px-3 py-2 text-xs font-bold text-red-600 hover:bg-red-50 dark:border-red-900 transition-colors"
                    >
                      Rechazar
                    </button>
                  )}
                </div>
              </article>
            );
          })
        )}
      </div>

      {/* Desktop table */}
      <div className="hidden md:block bg-white dark:bg-surface-dark rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800 overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-slate-50 dark:bg-slate-800 text-slate-500 dark:text-slate-400 text-xs uppercase tracking-widest">
            <tr>
              <th className="p-4">Espacio</th>
              <th className="p-4">Anfitrión</th>
              <th className="p-4">Categoría</th>
              <th className="p-4">Ciudad</th>
              <th className="p-4">Estado</th>
              <th className="p-4">Registro</th>
              <th className="p-4 text-right">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
            {isLoading ? (
              [1, 2, 3].map((i) => (
                <tr key={i}>
                  <td className="p-4"><Skeleton className="h-10 w-44" /></td>
                  <td className="p-4"><Skeleton className="h-4 w-32" /></td>
                  <td className="p-4"><Skeleton className="h-4 w-24" /></td>
                  <td className="p-4"><Skeleton className="h-4 w-24" /></td>
                  <td className="p-4"><Skeleton className="h-4 w-16" /></td>
                  <td className="p-4"><Skeleton className="h-4 w-20" /></td>
                  <td className="p-4"><Skeleton className="h-4 w-28 ml-auto" /></td>
                </tr>
              ))
            ) : filtered.length === 0 ? (
              <tr>
                <td colSpan={7} className="p-8">
                  <EmptyState
                    title={tab === 'pending' ? 'No hay espacios pendientes de aprobación' : 'No hay espacios'}
                    description="Todos los negocios están al día."
                    icon="check_circle"
                  />
                </td>
              </tr>
            ) : (
              filtered.map((venue) => {
                const thumb = venue.venue_images?.[0]?.image_url || FALLBACK_IMG;
                const photoCount = venue.venue_images?.length || 0;
                return (
                  <tr key={venue.id} className="text-sm dark:text-slate-300 hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition-colors">
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="relative">
                          <img src={thumb} alt={venue.name} className="w-12 h-12 rounded-xl object-cover border border-slate-100 dark:border-slate-700" />
                          <span className="absolute -bottom-1 -right-1 bg-black/70 text-white text-[9px] font-bold px-1.5 py-0.2 rounded-md">
                            {photoCount} 📷
                          </span>
                        </div>
                        <div>
                          <p className="font-bold text-slate-800 dark:text-white">{venue.name}</p>
                          <p className="text-xs text-slate-400">{venue.location || 'Sin dirección exacta'}</p>
                        </div>
                      </div>
                    </td>
                    <td className="p-4">
                      <p className="font-medium text-slate-700 dark:text-slate-200">{venue.profiles?.name || 'Sin nombre'}</p>
                      <p className="text-xs text-slate-400">{venue.profiles?.email || '—'}</p>
                    </td>
                    <td className="p-4 font-medium">{formatCategory(venue.category)}</td>
                    <td className="p-4">{venue.city || '—'}</td>
                    <td className="p-4">
                      <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${statusStyle[venue.status] || 'bg-slate-100 text-slate-600'}`}>
                        {statusLabel[venue.status] || venue.status}
                      </span>
                    </td>
                    <td className="p-4 text-xs text-slate-500">
                      {venue.created_at ? new Date(venue.created_at).toLocaleDateString() : '—'}
                    </td>
                    <td className="p-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => openInspector(venue)}
                          className="bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 font-bold text-xs px-3 py-1.5 rounded-xl hover:bg-slate-200 transition-colors flex items-center gap-1"
                        >
                          <span className="material-icons-round text-sm">visibility</span>
                          Revisar
                        </button>
                        {venue.status !== 'approved' && (
                          <button
                            onClick={() => handleApprove(venue.id)}
                            disabled={isSubmitting}
                            className="bg-emerald-600 text-white font-bold text-xs px-3 py-1.5 rounded-xl hover:bg-emerald-700 transition-all shadow-sm"
                          >
                            Aprobar
                          </button>
                        )}
                        {venue.status !== 'rejected' && (
                          <button
                            onClick={() => handleOpenReject(venue)}
                            disabled={isSubmitting}
                            className="text-red-500 font-bold text-xs px-2 py-1.5 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                          >
                            Rechazar
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* MODAL: INSPECTOR DETALLADO DEL ESPACIO */}
      {inspectVenue && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto" onClick={() => setInspectVenue(null)}>
          <div 
            className="bg-white dark:bg-surface-dark rounded-3xl max-w-4xl w-full max-h-[92vh] overflow-hidden shadow-2xl border border-slate-100 dark:border-slate-800 flex flex-col my-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-800/50">
              <div className="flex items-center gap-3">
                <span className={`text-xs font-bold px-3 py-1 rounded-full ${statusStyle[inspectVenue.status]}`}>
                  {statusLabel[inspectVenue.status]}
                </span>
                <h3 className="font-display font-bold text-lg text-slate-900 dark:text-white truncate max-w-md">
                  {inspectVenue.name}
                </h3>
              </div>
              <button 
                onClick={() => setInspectVenue(null)} 
                className="w-9 h-9 rounded-full flex items-center justify-center text-slate-400 hover:text-slate-600 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
              >
                <span className="material-icons-round">close</span>
              </button>
            </div>

            {/* Scrollable Content */}
            <div className="p-6 overflow-y-auto space-y-6">
              {/* Previous Rejection Alert if any */}
              {inspectVenue.rejection_reason && (
                <div className="p-4 rounded-2xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800">
                  <div className="flex items-center gap-2 text-red-700 dark:text-red-300 font-bold text-xs uppercase tracking-wider mb-1">
                    <span className="material-icons-round text-base">info</span> Motivo de rechazo registrado
                  </div>
                  <p className="text-sm text-red-600 dark:text-red-400">{inspectVenue.rejection_reason}</p>
                </div>
              )}

              {/* Photo Inspection Gallery */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                    Galería fotográfica ({inspectVenue.venue_images?.length || 0} imágenes)
                  </h4>
                  <span className="text-xs text-slate-500">Haz clic en una miniatura para agrandar</span>
                </div>

                {inspectVenue.venue_images && inspectVenue.venue_images.length > 0 ? (
                  <div className="space-y-3">
                    <div className="w-full h-80 bg-slate-900 rounded-2xl overflow-hidden relative border border-slate-200 dark:border-slate-700 flex items-center justify-center">
                      <img 
                        src={inspectVenue.venue_images[selectedPhotoIndex]?.image_url || FALLBACK_IMG} 
                        alt="Vista previa" 
                        className="w-full h-full object-contain"
                      />
                      <div className="absolute bottom-3 left-3 bg-black/70 text-white text-xs px-3 py-1 rounded-full">
                        Foto {selectedPhotoIndex + 1} de {inspectVenue.venue_images.length}
                      </div>
                    </div>
                    {/* Thumbnails row */}
                    <div className="flex gap-2 overflow-x-auto pb-2">
                      {inspectVenue.venue_images.map((img: any, idx: number) => (
                        <button
                          key={img.id || idx}
                          onClick={() => setSelectedPhotoIndex(idx)}
                          className={`shrink-0 w-20 h-20 rounded-xl overflow-hidden border-2 transition-all ${
                            selectedPhotoIndex === idx ? 'border-primary ring-2 ring-primary/30 scale-105' : 'border-slate-200 dark:border-slate-700 opacity-70 hover:opacity-100'
                          }`}
                        >
                          <img src={img.image_url} alt="" className="w-full h-full object-cover" />
                        </button>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="p-8 text-center bg-slate-50 dark:bg-slate-800 rounded-2xl border border-dashed border-slate-300 dark:border-slate-700">
                    <p className="text-sm text-slate-400">El anfitrión no ha subido imágenes para este espacio.</p>
                  </div>
                )}
              </div>

              {/* Grid: Anfitrión & Ubicación */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-2xl border border-slate-100 dark:border-slate-800">
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Datos del Anfitrión</p>
                  <p className="font-bold text-slate-800 dark:text-white text-base">{inspectVenue.profiles?.name || 'Nombre no especificado'}</p>
                  <p className="text-sm text-slate-500 mt-0.5">{inspectVenue.profiles?.email || 'Sin correo'}</p>
                  <p className="text-xs text-slate-400 mt-2">ID Anfitrión: {inspectVenue.provider_id}</p>
                </div>

                <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-2xl border border-slate-100 dark:border-slate-800">
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Ubicación y Categoría</p>
                  <p className="font-bold text-slate-800 dark:text-white">{inspectVenue.location || 'Sin dirección'}</p>
                  <p className="text-sm text-slate-500">{inspectVenue.city || 'Ciudad no indicada'} {inspectVenue.postal_code ? `• C.P. ${inspectVenue.postal_code}` : ''}</p>
                  <div className="mt-2 inline-block px-2.5 py-0.5 bg-primary/10 text-primary text-xs font-bold rounded-lg">
                    Categoría: {formatCategory(inspectVenue.category)}
                  </div>
                </div>
              </div>

              {/* Commercial Terms & Pricing Breakdown */}
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">Condiciones Comerciales y Capacidad</h4>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div className="p-3.5 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-slate-100 dark:border-slate-800">
                    <span className="text-xs text-slate-400">Precio Base</span>
                    <p className="text-lg font-bold text-primary mt-1">${Number(inspectVenue.base_price || inspectVenue.price_per_hour || 0).toLocaleString()} MXN</p>
                    <span className="text-[10px] text-slate-500">Por {inspectVenue.included_hours || inspectVenue.min_hours || 5} horas</span>
                  </div>

                  <div className="p-3.5 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-slate-100 dark:border-slate-800">
                    <span className="text-xs text-slate-400">Hora Extra</span>
                    <p className="text-lg font-bold text-slate-800 dark:text-white mt-1">${Number(inspectVenue.extra_hour_price || 0).toLocaleString()} MXN</p>
                    <span className="text-[10px] text-slate-500">Máx {inspectVenue.max_extra_hours || 6} hrs extra</span>
                  </div>

                  <div className="p-3.5 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-slate-100 dark:border-slate-800">
                    <span className="text-xs text-slate-400">Capacidad</span>
                    <p className="text-lg font-bold text-slate-800 dark:text-white mt-1">{inspectVenue.capacity || inspectVenue.base_capacity || 0} personas</p>
                    <span className="text-[10px] text-slate-500">Máx {inspectVenue.max_capacity || inspectVenue.capacity || 0} personas</span>
                  </div>

                  <div className="p-3.5 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-slate-100 dark:border-slate-800">
                    <span className="text-xs text-slate-400">Persona Extra</span>
                    <p className="text-lg font-bold text-slate-800 dark:text-white mt-1">${Number(inspectVenue.extra_person_price || 0).toLocaleString()} MXN</p>
                    <span className="text-[10px] text-slate-500">Por asistente adicional</span>
                  </div>
                </div>
              </div>

              {/* Description */}
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">Descripción del Negocio</h4>
                <div className="p-4 bg-slate-50 dark:bg-slate-800/40 rounded-2xl border border-slate-100 dark:border-slate-800 text-sm text-slate-700 dark:text-slate-300 whitespace-pre-line leading-relaxed">
                  {inspectVenue.description || 'El anfitrión no proporcionó una descripción.'}
                </div>
              </div>

              {/* Amenities & Rules */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">Amenidades / Servicios ({inspectVenue.amenities?.length || 0})</h4>
                  <div className="flex flex-wrap gap-1.5">
                    {inspectVenue.amenities && inspectVenue.amenities.length > 0 ? (
                      inspectVenue.amenities.map((a: string, i: number) => (
                        <span key={i} className="text-xs bg-slate-100 dark:bg-slate-800 px-3 py-1 rounded-lg text-slate-700 dark:text-slate-300">
                          ✓ {a}
                        </span>
                      ))
                    ) : (
                      <span className="text-xs text-slate-400">Sin amenidades seleccionadas</span>
                    )}
                  </div>
                </div>

                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">Reglas del Espacio ({inspectVenue.rules?.length || 0})</h4>
                  <div className="flex flex-wrap gap-1.5">
                    {inspectVenue.rules && inspectVenue.rules.length > 0 ? (
                      inspectVenue.rules.map((r: string, i: number) => (
                        <span key={i} className="text-xs bg-slate-100 dark:bg-slate-800 px-3 py-1 rounded-lg text-slate-700 dark:text-slate-300">
                          • {r}
                        </span>
                      ))
                    ) : (
                      <span className="text-xs text-slate-400">Sin reglas específicas</span>
                    )}
                  </div>
                </div>
              </div>

              {/* Cancellation Policy */}
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-1">Política de Cancelación</h4>
                <p className="text-sm font-semibold text-slate-700 dark:text-slate-300 capitalize">
                  Tipo: {inspectVenue.cancellation_type === 'non_refundable' ? 'No reembolsable' : inspectVenue.cancellation_type === 'flexible' ? `Flexible (${inspectVenue.cancellation_days || 30} días)` : 'Personalizada por niveles'}
                </p>
              </div>
            </div>

            {/* Modal Footer with Actions */}
            <div className="px-6 py-4 bg-slate-50 dark:bg-slate-800/80 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-3">
              <button
                onClick={() => setInspectVenue(null)}
                className="px-5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-sm font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-100 transition-colors"
              >
                Cerrar
              </button>

              <div className="flex items-center gap-3">
                {inspectVenue.status !== 'rejected' && (
                  <button
                    onClick={() => handleOpenReject(inspectVenue)}
                    disabled={isSubmitting}
                    className="px-5 py-2.5 rounded-xl border border-red-200 dark:border-red-800 text-sm font-bold text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                  >
                    Rechazar con Motivo
                  </button>
                )}

                {inspectVenue.status !== 'approved' && (
                  <button
                    onClick={() => handleApprove(inspectVenue.id)}
                    disabled={isSubmitting}
                    className="px-6 py-2.5 rounded-xl bg-emerald-600 text-white text-sm font-bold hover:bg-emerald-700 transition-all shadow-md shadow-emerald-600/20 flex items-center gap-2"
                  >
                    <span className="material-icons-round text-base">check_circle</span>
                    Aprobar Espacio
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: RECHAZAR CON MOTIVO */}
      {rejectVenueTarget && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4" onClick={() => setRejectVenueTarget(null)}>
          <div 
            className="bg-white dark:bg-surface-dark rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-100 dark:border-slate-800 space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-3 text-red-600">
              <div className="w-10 h-10 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
                <span className="material-icons-round text-xl">gavel</span>
              </div>
              <div>
                <h3 className="font-bold text-lg text-slate-900 dark:text-white">Rechazar Espacio</h3>
                <p className="text-xs text-slate-500 truncate max-w-xs">{rejectVenueTarget.name}</p>
              </div>
            </div>

            <p className="text-xs text-slate-500">
              Selecciona o escribe el motivo del rechazo. Este mensaje será notificado al anfitrión para que pueda corregirlo y volver a postular su negocio:
            </p>

            {/* Quick preset buttons */}
            <div className="space-y-1.5">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Motivos frecuentes:</span>
              <div className="flex flex-col gap-1.5 max-h-40 overflow-y-auto">
                {REJECTION_PRESETS.map((preset, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setRejectReason(preset)}
                    className="text-left text-xs p-2 rounded-xl bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 transition-colors border border-slate-100 dark:border-slate-700"
                  >
                    {preset}
                  </button>
                ))}
              </div>
            </div>

            {/* Custom reason textarea */}
            <div>
              <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                Mensaje de corrección para el anfitrión:
              </label>
              <textarea
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                placeholder="Ej. Por favor sube fotografías en formato horizontal y con buena iluminación..."
                rows={3}
                className="w-full p-3 rounded-xl border border-slate-200 dark:border-slate-700 dark:bg-slate-800 dark:text-white text-xs focus:ring-2 focus:ring-red-500 outline-none"
              />
            </div>

            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={() => setRejectVenueTarget(null)}
                className="flex-1 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-100 transition-colors"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleConfirmReject}
                disabled={isSubmitting}
                className="flex-1 py-2.5 rounded-xl bg-red-600 text-white text-xs font-bold hover:bg-red-700 transition-colors shadow-md shadow-red-600/20 disabled:opacity-50"
              >
                {isSubmitting ? 'Guardando…' : 'Confirmar Rechazo'}
              </button>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
};

export default Spaces;
