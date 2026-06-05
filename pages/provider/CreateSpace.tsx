import React, { useRef, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { toast } from 'sonner';
import { CreateSpaceProvider, useCreateSpace } from '../../context/CreateSpaceContext';
import { ErrorMessage } from '../../components/ui/ErrorMessage';
import { useUser } from '../../context/UserContext';
import { createVenue, updateVenue, getVenueForEdit, deleteVenueImages } from '../../src/services/providerService';
import { getCategories, Category } from '../../src/services/categoryService';
import { validateSpaceName } from '../../src/utils/profanityFilter';

const RULES = ['No mascotas', 'No fumar', 'Horarios de silencio', 'No fiestas'];

const CreateSpaceContent: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const venueId = searchParams.get('id');
  const isEdit = !!venueId;
  const { data, updateData, setData, step, setStep } = useCreateSpace();
  const { user } = useUser();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [errors, setErrors] = React.useState<Record<string, string>>({});
  const [loading, setLoading] = React.useState(false);
  const [loadingVenue, setLoadingVenue] = React.useState(isEdit);
  const [files, setFiles] = React.useState<File[]>([]);
  const [existingImages, setExistingImages] = React.useState<{ id: string; url: string }[]>([]);
  const [removedExistingIds, setRemovedExistingIds] = React.useState<string[]>([]);
  const [categories, setCategories] = React.useState<Category[]>([]);

  useEffect(() => {
    getCategories().then(setCategories);
  }, []);

  // Cargar venue para editar
  useEffect(() => {
    if (!venueId || !user?.id) return;
    setLoadingVenue(true);
    getVenueForEdit(user.id, venueId)
      .then((v) => {
        if (!v) {
          toast.error('Espacio no encontrado');
          navigate('/provider/spaces');
          return;
        }
        const imgs = (v.venue_images ?? []) as { id: string; image_url: string }[];
        setExistingImages(imgs.map((i) => ({ id: i.id, url: i.image_url })));
        setRemovedExistingIds([]);
        setData({
          name: v.name ?? '',
          type: v.type ?? 'Jardín',
          capacity: v.capacity?.toString() ?? '',
          description: v.description ?? '',
          images: imgs.map((i) => i.image_url),
          category: v.category ?? '',
          address: v.location ?? '',
          city: v.city ?? 'CDMX',
          lat: v.lat?.toString() ?? '',
          lng: v.lng?.toString() ?? '',
          pricePerHour: v.price_per_hour?.toString() ?? '',
          minHours: v.min_hours?.toString() ?? '4',
          extraHourPrice: v.extra_hour_price?.toString() ?? '',
          sizeSqm: v.size_sqm?.toString() ?? '',
          rules: v.rules ?? [],
        });
      })
      .catch((e) => {
        console.error(e);
        toast.error('Error al cargar espacio');
      })
      .finally(() => setLoadingVenue(false));
  }, [venueId, user?.id, setData, navigate]);

  const validateStep1 = () => {
    const e: Record<string, string> = {};
    const nameError = validateSpaceName(data.name);
    if (nameError) e.name = nameError;
    if (!data.capacity) e.capacity = 'La capacidad es requerida';
    if (!data.description.trim()) e.description = 'La descripción es requerida';
    else if (data.description.trim().length > 1000) e.description = 'La descripción no puede exceder 1000 caracteres';
    if (!data.category) e.category = 'La categoría es requerida';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const validateStep2 = () => {
    const e: Record<string, string> = {};
    if (!data.address.trim()) e.address = 'La dirección es requerida';
    if (!data.city.trim()) e.city = 'La ciudad es requerida';
    if (!data.pricePerHour || Number(data.pricePerHour) <= 0) e.pricePerHour = 'Ingresa un precio válido';
    if (!data.minHours || Number(data.minHours) < 1) e.minHours = 'Mínimo 1 hora';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSave = async () => {
    if (!user?.id || user.role !== 'provider') {
      toast.error('Debes iniciar sesión como anfitrión');
      return;
    }
    if (!validateStep1()) { setStep(1); return; }
    if (!validateStep2()) { setStep(2); return; }
    if (!isEdit && files.length === 0) {
      toast.error('Debes subir al menos una foto');
      setStep(3);
      return;
    }
    setLoading(true);
    try {
      const payload = {
        name: data.name.trim(),
        description: data.description.trim(),
        category: data.category,
        location: data.address.trim(),
        city: data.city.trim(),
        capacity: parseInt(data.capacity) || 0,
        size_sqm: data.sizeSqm ? parseInt(data.sizeSqm) : 0,
        price_per_hour: Number(data.pricePerHour),
        min_hours: Number(data.minHours) || 4,
        extra_hour_price: data.extraHourPrice ? Number(data.extraHourPrice) : Number(data.pricePerHour),
        lat: data.lat ? Number(data.lat) : null,
        lng: data.lng ? Number(data.lng) : null,
        rules: data.rules,
      };
      if (isEdit && venueId) {
        if (removedExistingIds.length > 0) {
          await deleteVenueImages(user.id, venueId, removedExistingIds);
        }
        await updateVenue(user.id, venueId, { ...payload, imageFiles: files });
        toast.success('Espacio actualizado');
      } else {
        await createVenue(user.id, { ...payload, imageFiles: files });
        toast.success('Espacio creado, pendiente de aprobación');
      }
      navigate('/provider/spaces');
    } catch (e: any) {
      console.error(e);
      toast.error(e.message ?? 'Error al guardar');
    } finally {
      setLoading(false);
    }
  };

  const handleBack = () => {
    if (step > 1) setStep(step - 1);
    else navigate(-1);
  };

  const handleContinue = () => {
    if (step === 1 && validateStep1()) setStep(2);
    else if (step === 2 && validateStep2()) setStep(3);
    else if (step === 3) handleSave();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const uploaded = e.target.files;
    if (uploaded) {
      const arr = Array.from(uploaded);
      setFiles(prev => [...prev, ...arr]);
      const newImages = arr.map(f => URL.createObjectURL(f as Blob));
      updateData({ images: [...data.images, ...newImages] });
    }
  };

  const removeImage = (index: number) => {
    const url = data.images[index];
    // ¿Es existente?
    const existing = existingImages.find((e) => e.url === url && !removedExistingIds.includes(e.id));
    if (existing) {
      setRemovedExistingIds((prev) => [...prev, existing.id]);
      updateData({ images: data.images.filter((_, i) => i !== index) });
      return;
    }
    // Es nueva: localizar el índice dentro de `files` (las nuevas van después de las existentes vivas)
    const liveExistingCount = existingImages.filter((e) => !removedExistingIds.includes(e.id)).length;
    const fileIdx = index - liveExistingCount;
    updateData({ images: data.images.filter((_, i) => i !== index) });
    setFiles((prev) => prev.filter((_, i) => i !== fileIdx));
  };

  const toggleRule = (rule: string) => {
    updateData({
      rules: data.rules.includes(rule)
        ? data.rules.filter(r => r !== rule)
        : [...data.rules, rule],
    });
  };

  const inputBase = 'w-full bg-slate-50 dark:bg-slate-800/50 border-none rounded-2xl px-5 py-4 text-sm font-bold text-slate-900 dark:text-white focus:ring-2 focus:ring-primary outline-none transition-all';

  if (loadingVenue) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background-light dark:bg-background-dark">
        <p className="text-slate-400 font-bold uppercase tracking-widest text-xs animate-pulse">Cargando espacio...</p>
      </div>
    );
  }

  return (
    <div className="bg-background-light dark:bg-background-dark font-sans text-slate-800 dark:text-slate-100 antialiased min-h-screen flex flex-col max-w-md mx-auto relative shadow-2xl transition-colors">
      <header className="sticky top-0 z-50 bg-white/90 dark:bg-surface-dark/90 backdrop-blur-md border-b border-slate-100 dark:border-slate-800 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button onClick={handleBack} className="p-2 -ml-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors active:scale-90">
            <span className="material-icons-outlined block">arrow_back</span>
          </button>
          <h1 className="text-lg font-bold text-slate-900 dark:text-white font-display tracking-tight">
            {isEdit ? 'Editar Espacio' : 'Alta de Espacio'}
          </h1>
        </div>
        <button onClick={() => navigate('/provider/spaces')} className="p-2 -mr-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors">
          <span className="material-icons-outlined block">close</span>
        </button>
      </header>

      <main className="flex-1 pb-32">
        <div className="px-6 pt-8 pb-6">
          <div className="flex justify-between items-end mb-3">
            <span className="text-sm font-bold text-slate-900 dark:text-white tracking-tight uppercase">Progreso</span>
            <span className="text-xs font-bold text-primary uppercase tracking-widest">Paso {step} de 3</span>
          </div>
          <div className="w-full h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
            <div
              className="bg-primary h-full rounded-full transition-all duration-700 shadow-[0_0_10px_rgba(242,107,58,0.4)]"
              style={{ width: `${(step / 3) * 100}%` }}
            />
          </div>
        </div>

        {step === 1 && (
          <section className="px-6 mb-10 animate-in fade-in slide-in-from-right-4 duration-300">
            <h2 className="text-lg font-bold mb-6 dark:text-white font-display tracking-tight">Descripción del espacio</h2>
            <div className="bg-white dark:bg-surface-dark border border-slate-100 dark:border-slate-800 rounded-[32px] p-8 shadow-sm space-y-6">
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Nombre del espacio</label>
                <input className={inputBase} placeholder="Ej: Terraza Panorámica" value={data.name} onChange={(e) => updateData({ name: e.target.value })} />
                <ErrorMessage message={errors.name} />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Tipo de espacio</label>
                <div className="relative">
                  <select className={`${inputBase} appearance-none`} value={data.type} onChange={(e) => updateData({ type: e.target.value })}>
                    <option>Jardín</option>
                    <option>Salón</option>
                    <option>Terraza</option>
                    <option>Roof Garden</option>
                    <option>Casa</option>
                    <option>Quinta</option>
                  </select>
                  <span className="material-icons-outlined absolute right-5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">expand_more</span>
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Categoría</label>
                <div className="relative">
                  <select className={`${inputBase} appearance-none`} value={data.category} onChange={(e) => updateData({ category: e.target.value })}>
                    <option value="">Selecciona una categoría</option>
                    {categories.map((c) => <option key={c.id} value={c.slug}>{c.name}</option>)}
                  </select>
                  <span className="material-icons-outlined absolute right-5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">expand_more</span>
                </div>
                <ErrorMessage message={errors.category} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Capacidad</label>
                  <input className={inputBase} type="number" placeholder="Personas" value={data.capacity} onChange={(e) => updateData({ capacity: e.target.value })} />
                  <ErrorMessage message={errors.capacity} />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Tamaño (m²)</label>
                  <input className={inputBase} type="number" placeholder="Opcional" value={data.sizeSqm} onChange={(e) => updateData({ sizeSqm: e.target.value })} />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Reglas de la casa</label>
                <div className="grid grid-cols-2 gap-3">
                  {RULES.map((rule) => (
                    <label key={rule} className="flex items-center gap-2 bg-slate-50 dark:bg-slate-800/50 p-3 rounded-xl cursor-pointer">
                      <input type="checkbox" className="accent-primary" checked={data.rules.includes(rule)} onChange={() => toggleRule(rule)} />
                      <span className="text-xs font-medium text-slate-700 dark:text-slate-200">{rule}</span>
                    </label>
                  ))}
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Descripción detallada</label>
                <textarea
                  className={`${inputBase} resize-none`}
                  rows={5}
                  placeholder="Describe las características principales..."
                  value={data.description}
                  onChange={(e) => updateData({ description: e.target.value })}
                />
                <ErrorMessage message={errors.description} />
              </div>
            </div>
          </section>
        )}

        {step === 2 && (
          <section className="px-6 mb-10 animate-in fade-in slide-in-from-right-4 duration-300 space-y-8">
            <div>
              <h2 className="text-lg font-bold mb-6 dark:text-white font-display tracking-tight">Ubicación</h2>
              <div className="bg-white dark:bg-surface-dark border border-slate-100 dark:border-slate-800 rounded-[32px] p-8 shadow-sm space-y-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Dirección completa</label>
                  <input className={inputBase} placeholder="Calle, número, colonia" value={data.address} onChange={(e) => updateData({ address: e.target.value })} />
                  <ErrorMessage message={errors.address} />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Ciudad</label>
                  <input className={inputBase} placeholder="CDMX" value={data.city} onChange={(e) => updateData({ city: e.target.value })} />
                  <ErrorMessage message={errors.city} />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Latitud</label>
                    <input className={inputBase} type="number" step="any" placeholder="19.4326" value={data.lat} onChange={(e) => updateData({ lat: e.target.value })} />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Longitud</label>
                    <input className={inputBase} type="number" step="any" placeholder="-99.1332" value={data.lng} onChange={(e) => updateData({ lng: e.target.value })} />
                  </div>
                </div>
                <p className="text-[10px] text-slate-400 leading-relaxed">
                  Tip: obtén las coordenadas desde Google Maps (clic derecho sobre tu ubicación → copiar).
                </p>
              </div>
            </div>
            <div>
              <h2 className="text-lg font-bold mb-6 dark:text-white font-display tracking-tight">Precio</h2>
              <div className="bg-white dark:bg-surface-dark border border-slate-100 dark:border-slate-800 rounded-[32px] p-8 shadow-sm space-y-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Precio por hora (MXN)</label>
                  <input className={inputBase} type="number" placeholder="500" value={data.pricePerHour} onChange={(e) => updateData({ pricePerHour: e.target.value })} />
                  <ErrorMessage message={errors.pricePerHour} />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Horas mínimas</label>
                    <input className={inputBase} type="number" placeholder="4" value={data.minHours} onChange={(e) => updateData({ minHours: e.target.value })} />
                    <ErrorMessage message={errors.minHours} />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Hora extra (MXN)</label>
                    <input className={inputBase} type="number" placeholder="Igual al base" value={data.extraHourPrice} onChange={(e) => updateData({ extraHourPrice: e.target.value })} />
                  </div>
                </div>
              </div>
            </div>
          </section>
        )}

        {step === 3 && (
          <section className="px-6 mb-10 animate-in fade-in slide-in-from-right-4 duration-300">
            <h2 className="text-lg font-bold mb-6 dark:text-white font-display tracking-tight">Fotos del espacio</h2>
            <div className="bg-white dark:bg-surface-dark border border-slate-100 dark:border-slate-800 rounded-[32px] p-6 shadow-sm space-y-6">
              <div
                onClick={() => fileInputRef.current?.click()}
                className="border-4 border-dashed border-slate-100 dark:border-slate-800 rounded-[28px] p-8 flex flex-col items-center text-center group cursor-pointer hover:border-primary/30 transition-all"
              >
                <input type="file" ref={fileInputRef} className="hidden" multiple accept="image/*" onChange={handleFileChange} />
                <div className="w-16 h-16 bg-orange-50 dark:bg-orange-900/20 rounded-[24px] flex items-center justify-center mb-4 text-primary group-hover:scale-110 transition-transform">
                  <span className="material-icons-outlined text-3xl">photo_camera</span>
                </div>
                <p className="text-sm font-bold text-slate-800 dark:text-white mb-2 tracking-tight">Sube fotos de tu espacio</p>
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mb-6 max-w-[220px]">Recomendamos al menos 5 fotos de alta calidad</p>
                <button type="button" className="bg-primary text-white px-8 py-3 rounded-2xl text-sm font-bold shadow-lg shadow-primary/20 flex items-center gap-2 active:scale-95 transition-all">
                  <span className="material-icons-outlined text-lg">add</span>
                  Agregar fotos
                </button>
              </div>
              <div className="flex gap-4 overflow-x-auto no-scrollbar py-2">
                {data.images.map((img, i) => (
                  <div key={i} className="relative flex-shrink-0 w-28 h-28 rounded-[20px] overflow-hidden border-2 border-slate-50 dark:border-slate-800 shadow-sm group">
                    <img alt="Uploaded" className="w-full h-full object-cover" src={img} />
                    <button onClick={(e) => { e.stopPropagation(); removeImage(i); }} className="absolute top-2 right-2 bg-black/60 text-white rounded-full p-1 active:scale-75 transition-all">
                      <span className="material-icons-outlined text-[16px]">close</span>
                    </button>
                  </div>
                ))}
              </div>
              {isEdit && (
                <p className="text-[10px] text-slate-400 leading-relaxed">
                  Toca la ✕ para eliminar fotos existentes. Las fotos nuevas se agregarán al guardar.
                </p>
              )}
            </div>
          </section>
        )}
      </main>

      <footer className="fixed bottom-0 left-0 right-0 bg-white/95 dark:bg-surface-dark/95 backdrop-blur-xl border-t border-slate-100 dark:border-slate-800 px-6 py-6 flex gap-4 max-w-md mx-auto z-[60]">
        <button
          onClick={handleBack}
          disabled={loading}
          className="flex-1 py-4 border-2 border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-200 font-bold text-[11px] uppercase tracking-[0.15em] rounded-2xl transition-all active:scale-95 disabled:opacity-50"
        >
          {step === 1 ? 'Cancelar' : 'Atrás'}
        </button>
        <button
          onClick={handleContinue}
          disabled={loading}
          className="flex-1 py-4 bg-primary text-white font-bold text-[11px] uppercase tracking-[0.15em] rounded-2xl shadow-xl shadow-primary/20 transition-all active:scale-95 hover:bg-orange-600 disabled:opacity-50"
        >
          {loading ? 'Guardando...' : step === 3 ? (isEdit ? 'Actualizar' : 'Publicar') : 'Continuar'}
        </button>
      </footer>
    </div>
  );
};

const CreateSpace: React.FC = () => (
  <CreateSpaceProvider>
    <CreateSpaceContent />
  </CreateSpaceProvider>
);

export default CreateSpace;
