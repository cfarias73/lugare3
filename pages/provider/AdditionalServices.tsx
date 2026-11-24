import React, { useEffect, useMemo, useState, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { toast } from 'sonner';
import ProviderLayout from '../../components/ProviderLayout';
import { useUser } from '../../context/UserContext';
import { Skeleton } from '../../components/ui/Skeleton';
import { EmptyState } from '../../components/ui/EmptyState';
import ConfirmationDialog from '../../components/ui/ConfirmationDialog';
import {
  listProviderServices,
  createService,
  updateService,
  deleteService,
  getProviderVenues,
  VenueService,
} from '../../src/services/providerService';

interface VenueOption { id: string; name: string }
interface ServiceRow extends VenueService { venue_name: string }

const iconFor = (name: string): { icon: string; color: string } => {
  const n = name.toLowerCase();
  if (/(cater|comida|food|bebida)/.test(n)) return { icon: 'restaurant', color: 'bg-amber-100 dark:bg-amber-900/30 text-amber-600' };
  if (/(decora|flor|mont)/.test(n)) return { icon: 'palette', color: 'bg-rose-100 dark:bg-rose-900/30 text-rose-500' };
  if (/(dj|music|sonido|audio)/.test(n)) return { icon: 'headphones', color: 'bg-blue-100 dark:bg-blue-900/30 text-blue-500' };
  if (/(foto|video|camar)/.test(n)) return { icon: 'photo_camera', color: 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-600' };
  if (/(seguridad|guardia)/.test(n)) return { icon: 'shield', color: 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600' };
  return { icon: 'extension', color: 'bg-slate-100 dark:bg-slate-800 text-slate-500' };
};

const ServiceFormModal: React.FC<{
  open: boolean;
  onClose: () => void;
  venues: VenueOption[];
  initial?: ServiceRow | null;
  onSave: (data: { id?: string; venue_id: string; name: string; description: string; price: number }) => Promise<void>;
}> = ({ open, onClose, venues, initial, onSave }) => {
  const [venueId, setVenueId] = useState('');
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open) {
      setVenueId(initial?.venue_id || venues[0]?.id || '');
      setName(initial?.name || '');
      setDescription(initial?.description || '');
      setPrice(initial ? String(initial.price) : '');
    }
  }, [open, initial, venues]);

  if (!open) return null;

  const submit = async () => {
    if (!venueId) return toast.error('Selecciona un espacio');
    if (!name.trim()) return toast.error('Pon un nombre al servicio');
    const p = parseFloat(price);
    if (isNaN(p) || p < 0) return toast.error('Precio inválido');
    setSaving(true);
    try {
      await onSave({ id: initial?.id, venue_id: venueId, name: name.trim(), description: description.trim(), price: p });
      onClose();
    } catch (e: any) {
      toast.error(e?.message || 'No se pudo guardar');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white dark:bg-surface-dark rounded-[28px] p-6 shadow-2xl w-full max-w-md border border-slate-100 dark:border-slate-800 space-y-4">
        <h3 className="text-lg font-bold dark:text-white font-display">{initial ? 'Editar servicio' : 'Nuevo servicio'}</h3>

        <div>
          <label className="text-[11px] font-bold uppercase tracking-widest text-slate-400">Espacio</label>
          <select
            value={venueId}
            onChange={(e) => setVenueId(e.target.value)}
            className="mt-1 w-full bg-slate-100 dark:bg-slate-800 rounded-xl px-4 py-3 text-sm dark:text-white outline-none focus:ring-2 focus:ring-primary/30"
          >
            {venues.map((v) => <option key={v.id} value={v.id}>{v.name}</option>)}
          </select>
        </div>

        <div>
          <label className="text-[11px] font-bold uppercase tracking-widest text-slate-400">Nombre</label>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Ej. Servicio de catering"
            className="mt-1 w-full bg-slate-100 dark:bg-slate-800 rounded-xl px-4 py-3 text-sm dark:text-white outline-none focus:ring-2 focus:ring-primary/30"
          />
        </div>

        <div>
          <label className="text-[11px] font-bold uppercase tracking-widest text-slate-400">Precio (MXN)</label>
          <input
            type="number"
            min={0}
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            placeholder="0"
            className="mt-1 w-full bg-slate-100 dark:bg-slate-800 rounded-xl px-4 py-3 text-sm dark:text-white outline-none focus:ring-2 focus:ring-primary/30"
          />
        </div>

        <div>
          <label className="text-[11px] font-bold uppercase tracking-widest text-slate-400">Descripción</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={3}
            placeholder="Detalles del servicio..."
            className="mt-1 w-full bg-slate-100 dark:bg-slate-800 rounded-xl px-4 py-3 text-sm dark:text-white outline-none focus:ring-2 focus:ring-primary/30 resize-none"
          />
        </div>

        <div className="flex gap-3 pt-2">
          <button onClick={onClose} className="flex-1 py-3 rounded-xl font-bold text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800">Cancelar</button>
          <button onClick={submit} disabled={saving} className="flex-1 py-3 rounded-xl font-bold text-white bg-primary disabled:opacity-50">
            {saving ? 'Guardando...' : 'Guardar'}
          </button>
        </div>
      </div>
    </div>
  );
};

const AdditionalServices: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useUser();
  const [searchParams] = useSearchParams();
  const isWizard = searchParams.get('wizard') === 'true';

  const [services, setServices] = useState<ServiceRow[]>([]);
  const [venues, setVenues] = useState<VenueOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<ServiceRow | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [confirmDel, setConfirmDel] = useState<ServiceRow | null>(null);

  const load = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      const [sv, vn] = await Promise.all([
        listProviderServices(user.id),
        getProviderVenues(user.id),
      ]);
      setServices(sv);
      setVenues((vn || []).map((v: any) => ({ id: v.id, name: v.name })));
    } catch (e: any) {
      toast.error(e?.message || 'No se pudieron cargar los servicios');
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => { load(); }, [load]);

  const handleSave = async (data: { id?: string; venue_id: string; name: string; description: string; price: number }) => {
    if (data.id) {
      await updateService(data.id, { venue_id: data.venue_id, name: data.name, description: data.description, price: data.price });
      toast.success('Servicio actualizado');
    } else {
      await createService(data.venue_id, { name: data.name, description: data.description, price: data.price });
      toast.success('Servicio creado');
    }
    await load();
  };

  const handleDelete = async () => {
    if (!confirmDel) return;
    try {
      await deleteService(confirmDel.id);
      toast.success('Servicio eliminado');
      setServices((prev) => prev.filter((s) => s.id !== confirmDel.id));
    } catch (e: any) {
      toast.error(e?.message || 'No se pudo eliminar');
    } finally {
      setConfirmDel(null);
    }
  };

  const openCreate = () => {
    if (venues.length === 0) { toast.error('Primero crea un espacio'); return; }
    setEditing(null); setModalOpen(true);
  };
  const openEdit = (s: ServiceRow) => { setEditing(s); setModalOpen(true); };

  const Content = (
    <div className="p-6 space-y-8">
      {isWizard && (
        <div className="animate-in fade-in duration-500">
          <div className="flex justify-between items-end mb-3">
            <span className="text-sm font-bold text-slate-900 dark:text-white tracking-tight uppercase">Progreso</span>
            <span className="text-xs font-bold text-primary uppercase tracking-widest">Paso 3 de 4</span>
          </div>
          <div className="w-full h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
            <div className="bg-primary h-full rounded-full transition-all duration-700 shadow-[0_0_10px_rgba(242,107,58,0.4)] w-3/4"></div>
          </div>
        </div>
      )}

      <section className="bg-white dark:bg-surface-dark border-l-4 border-secondary rounded-[28px] p-6 flex gap-5 shadow-sm border border-slate-100 dark:border-slate-800">
        <div className="bg-cyan-50 dark:bg-cyan-900/30 p-3 rounded-2xl h-fit text-secondary transform rotate-6">
          <span className="material-icons-outlined text-2xl">auto_awesome</span>
        </div>
        <div>
          <h2 className="font-bold text-slate-900 dark:text-white text-base mb-1 tracking-tight">Aumenta el valor de tu espacio</h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed font-medium">
            Ofrece servicios adicionales (catering, decoración, DJ...) y aumenta tus ingresos.
          </p>
        </div>
      </section>

      <button
        onClick={openCreate}
        className="w-full bg-primary hover:bg-orange-600 text-white font-bold py-5 rounded-2xl shadow-xl shadow-primary/20 flex items-center justify-center gap-3 transition-all active:scale-[0.98] uppercase tracking-widest text-xs"
      >
        <span className="material-icons-outlined text-xl">add_circle_outline</span>
        Añadir nuevo servicio
      </button>

      <div className="space-y-6">
        <h3 className="font-bold text-slate-800 dark:text-slate-200 px-1 tracking-tight">Mis servicios adicionales</h3>

        {loading ? (
          <div className="space-y-4">
            <Skeleton className="h-40 rounded-[32px]" />
            <Skeleton className="h-40 rounded-[32px]" />
          </div>
        ) : services.length === 0 ? (
          <EmptyState
            icon="extension"
            title="Sin servicios todavía"
            description={venues.length === 0 ? 'Crea primero un espacio para añadir servicios.' : 'Crea tu primer servicio adicional.'}
          />
        ) : (
          services.map((svc) => {
            const meta = iconFor(svc.name);
            return (
              <div key={svc.id} className="bg-white dark:bg-surface-dark p-7 rounded-[32px] shadow-sm border border-slate-100 dark:border-slate-800 space-y-5">
                <div className="flex justify-between items-start">
                  <div className="flex gap-4 min-w-0">
                    <div className={`w-14 h-14 rounded-2xl flex items-center justify-center ${meta.color} shadow-sm flex-shrink-0`}>
                      <span className="material-icons-outlined text-2xl">{meta.icon}</span>
                    </div>
                    <div className="min-w-0">
                      <h4 className="font-bold text-lg dark:text-white tracking-tight truncate">{svc.name}</h4>
                      <p className="text-[10px] text-secondary font-bold uppercase tracking-widest truncate">{svc.venue_name}</p>
                    </div>
                  </div>
                  <div className="flex gap-2 flex-shrink-0">
                    <button onClick={() => openEdit(svc)} className="w-10 h-10 flex items-center justify-center text-secondary bg-cyan-50 dark:bg-cyan-900/20 rounded-xl hover:bg-secondary hover:text-white transition-all">
                      <span className="material-icons-outlined text-lg">edit_note</span>
                    </button>
                    <button onClick={() => setConfirmDel(svc)} className="w-10 h-10 flex items-center justify-center text-slate-300 hover:text-red-500 transition-all">
                      <span className="material-icons-outlined text-lg">delete_outline</span>
                    </button>
                  </div>
                </div>
                <div className="space-y-3 py-4 border-y border-slate-50 dark:border-slate-800/50">
                  <div className="flex justify-between text-sm font-medium">
                    <span className="text-slate-400">Precio:</span>
                    <span className="font-bold dark:text-white">${Number(svc.price).toLocaleString('es-MX')}</span>
                  </div>
                </div>
                {svc.description && (
                  <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed font-medium">{svc.description}</p>
                )}
              </div>
            );
          })
        )}
      </div>

      <ServiceFormModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        venues={venues}
        initial={editing}
        onSave={handleSave}
      />
      <ConfirmationDialog
        isOpen={!!confirmDel}
        onClose={() => setConfirmDel(null)}
        onConfirm={handleDelete}
        title="Eliminar servicio"
        message={`¿Eliminar "${confirmDel?.name}"? Esta acción no se puede deshacer.`}
        confirmText="Eliminar"
      />
    </div>
  );

  if (isWizard) {
    return (
      <div className="flex flex-col min-h-screen bg-background-light dark:bg-background-dark max-w-md mx-auto shadow-2xl relative transition-colors overflow-hidden border-x border-slate-100 dark:border-slate-800">
        <header className="sticky top-0 z-50 bg-white/90 dark:bg-surface-dark/90 backdrop-blur-md border-b border-slate-100 dark:border-slate-800 px-6 pt-[calc(env(safe-area-inset-top,0px)+1rem)] pb-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button onClick={() => navigate(-1)} className="p-2 -ml-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors active:scale-90">
              <span className="material-icons-outlined block">arrow_back</span>
            </button>
            <h1 className="text-lg font-bold text-slate-900 dark:text-white font-display tracking-tight">Servicios Adicionales</h1>
          </div>
          <button onClick={() => navigate('/provider/dashboard')} className="p-2 -mr-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors">
            <span className="material-icons-outlined block">close</span>
          </button>
        </header>

        <main className="flex-1 pb-32 overflow-y-auto no-scrollbar">{Content}</main>

        <footer className="fixed bottom-0 left-0 right-0 bg-white/95 dark:bg-surface-dark/95 backdrop-blur-xl border-t border-slate-100 dark:border-slate-800 px-6 pt-4 pb-[calc(env(safe-area-inset-bottom,0px)+1.25rem)] flex gap-4 max-w-md mx-auto z-[60]">
          <button onClick={() => navigate('/provider/calendar?wizard=true')} className="flex-1 py-4 bg-primary text-white font-bold text-[11px] uppercase tracking-[0.15em] rounded-2xl shadow-xl shadow-primary/20 transition-all active:scale-95 hover:bg-orange-600">
            Continuar
          </button>
        </footer>
      </div>
    );
  }

  return (
    <ProviderLayout>
      <header className="sticky top-0 z-50 bg-white dark:bg-surface-dark px-6 pt-[calc(env(safe-area-inset-top,0px)+1.25rem)] pb-5 flex items-center justify-between border-b border-slate-100 dark:border-slate-800 transition-colors">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate(-1)} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors active:scale-90">
            <span className="material-icons-outlined text-slate-700 dark:text-slate-200">arrow_back</span>
          </button>
          <h1 className="text-xl font-bold dark:text-white font-display tracking-tight">Servicios Adicionales</h1>
        </div>
      </header>
      {Content}
    </ProviderLayout>
  );
};

export default AdditionalServices;
