import React, { useRef, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { toast } from 'sonner';
import { CreateSpaceProvider, useCreateSpace } from '../../context/CreateSpaceContext';
import { ErrorMessage } from '../../components/ui/ErrorMessage';
import { useUser } from '../../context/UserContext';
import { createVenue, updateVenue, getVenueForEdit, deleteVenueImages } from '../../src/services/providerService';
import { getCategories, Category } from '../../src/services/categoryService';
import { validateSpaceName } from '../../src/utils/profanityFilter';
import { AMENITIES } from '../../src/constants/amenities';
import { FLEXIBLE_DAY_OPTIONS } from '../../src/utils/cancellation';

const RULES = ['No mascotas', 'No fumar', 'Horarios de silencio'];

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
          postalCode: v.postal_code ?? '',
          lat: v.lat?.toString() ?? '',
          lng: v.lng?.toString() ?? '',
          basePrice: v.base_price?.toString() ?? '',
          baseCapacity: v.base_capacity?.toString() ?? v.capacity?.toString() ?? '',
          maxCapacity: v.max_capacity?.toString() ?? v.capacity?.toString() ?? '',
          includedHours: v.included_hours?.toString() ?? v.min_hours?.toString() ?? '5',
          extraPersonPrice: v.extra_person_price?.toString() ?? '0',
          extraHourPrice: v.extra_hour_price?.toString() ?? '',
          maxExtraHours: v.max_extra_hours?.toString() ?? '6',
          pricePerHour: v.price_per_hour?.toString() ?? '',
          minHours: v.min_hours?.toString() ?? '5',
          sizeSqm: v.size_sqm?.toString() ?? '',
          rules: v.rules ?? [],
          amenities: Array.isArray(v.amenities) ? v.amenities : [],
          cancellationType: (v.cancellation_type as any) ?? 'non_refundable',
          cancellationDays: v.cancellation_days?.toString() ?? '30',
          cancellationTiers: Array.isArray(v.cancellation_tiers) && v.cancellation_tiers.length > 0
            ? v.cancellation_tiers.map((t: any) => ({ days: String(t.days ?? ''), percent: String(t.percent ?? '') }))
            : [{ days: '60', percent: '100' }, { days: '30', percent: '50' }],
          schedules: v.schedules || {
            morning: { enabled: true, start: '08:00', end: '13:00' },
            afternoon: { enabled: true, start: '14:00', end: '19:00' },
            night: { enabled: true, start: '20:00', end: '02:00' },
          },
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
    if (data.sizeSqm) {
      const sz = Number(data.sizeSqm);
      if (!Number.isFinite(sz) || sz <= 0) e.sizeSqm = 'El tamaño debe ser mayor a 0';
      else if (sz > 100000) e.sizeSqm = 'El tamaño no puede exceder 100,000 m²';
    }
    if (!data.description.trim()) e.description = 'La descripción es requerida';
    else if (data.description.trim().length > 1000) e.description = 'La descripción no puede exceder 1000 caracteres';
    if (!data.category) e.category = 'La categoría es requerida';
    if (data.cancellationType === 'custom') {
      const valid = data.cancellationTiers.filter((t) => t.days !== '' && t.percent !== '');
      if (valid.length === 0) e.cancellation = 'Agrega al menos una condición de cancelación';
      else if (valid.some((t) => Number(t.percent) > 100)) e.cancellation = 'El reembolso no puede exceder 100%';
    }
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const validateStep2 = () => {
    const e: Record<string, string> = {};
    if (!data.address.trim()) e.address = 'La dirección es requerida';
    if (!data.city.trim()) e.city = 'La ciudad es requerida';

    const basePrice = Number(data.basePrice);
    if (!data.basePrice || !Number.isFinite(basePrice) || basePrice <= 0) e.basePrice = 'Ingresa el precio base';
    else if (basePrice > 10000000) e.basePrice = 'Precio demasiado alto';

    const baseCap = Number(data.baseCapacity);
    if (!data.baseCapacity || !Number.isFinite(baseCap) || baseCap <= 0) e.baseCapacity = 'Capacidad base requerida';
    else if (baseCap > 10000) e.baseCapacity = 'No puede exceder 10,000';

    const maxCap = Number(data.maxCapacity);
    if (!data.maxCapacity || !Number.isFinite(maxCap) || maxCap <= 0) e.maxCapacity = 'Capacidad máxima requerida';
    else if (maxCap < baseCap) e.maxCapacity = 'Debe ser mayor o igual a la base';
    else if (maxCap > 10000) e.maxCapacity = 'No puede exceder 10,000';

    const incH = Number(data.includedHours);
    if (!data.includedHours || !Number.isFinite(incH) || incH < 1) e.includedHours = 'Mínimo 1 hora';
    else if (incH > 24) e.includedHours = 'Máximo 24 horas';

    const ep = Number(data.extraPersonPrice);
    if (data.extraPersonPrice && (!Number.isFinite(ep) || ep < 0)) e.extraPersonPrice = 'No puede ser negativo';

    const eh = Number(data.extraHourPrice);
    if (!data.extraHourPrice || !Number.isFinite(eh) || eh < 0) e.extraHourPrice = 'Ingresa el costo por hora extra';

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
      const basePrice = Number(data.basePrice);
      const includedHours = Number(data.includedHours) || 5;
      const baseCapacity = Number(data.baseCapacity);
      const maxCapacity = Number(data.maxCapacity);
      const extraPersonPrice = data.extraPersonPrice ? Number(data.extraPersonPrice) : 0;
      const extraHourPrice = Number(data.extraHourPrice);

      const payload = {
        name: data.name.trim(),
        description: data.description.trim(),
        category: data.category,
        location: data.address.trim(),
        city: data.city.trim(),
        postal_code: data.postalCode.trim() || null,
        capacity: maxCapacity,
        size_sqm: data.sizeSqm ? parseInt(data.sizeSqm) : 0,
        // Legado (mantenido para compatibilidad con flujos existentes)
        price_per_hour: Math.round(basePrice / includedHours),
        min_hours: includedHours,
        extra_hour_price: extraHourPrice,
        // Nuevo modelo flexible
        base_price: basePrice,
        base_capacity: baseCapacity,
        max_capacity: maxCapacity,
        included_hours: includedHours,
        extra_person_price: extraPersonPrice,
        max_extra_hours: data.maxExtraHours !== '' ? Math.max(0, parseInt(data.maxExtraHours)) : 6,
        lat: data.lat ? Number(data.lat) : null,
        lng: data.lng ? Number(data.lng) : null,
        rules: data.rules,
        amenities: data.amenities,
        cancellation_type: data.cancellationType,
        cancellation_days: data.cancellationType === 'flexible' ? Number(data.cancellationDays) || 30 : null,
        cancellation_tiers: data.cancellationType === 'custom'
          ? data.cancellationTiers
              .map((t) => ({ days: Number(t.days), percent: Number(t.percent) }))
              .filter((t) => Number.isFinite(t.days) && t.days >= 0 && Number.isFinite(t.percent))
              .map((t) => ({ days: Math.round(t.days), percent: Math.min(100, Math.max(0, Math.round(t.percent))) }))
              .sort((a, b) => b.days - a.days)
          : null,
        schedules: data.schedules,
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
      console.error('[CreateSpace] save failed', e);
      const parts = [e?.message, e?.details, e?.hint, e?.code].filter(Boolean);
      toast.error(parts.length ? parts.join(' — ') : 'Error al guardar el espacio');
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

  const toggleAmenity = (key: string) => {
    updateData({
      amenities: data.amenities.includes(key)
        ? data.amenities.filter(a => a !== key)
        : [...data.amenities, key],
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
                <input
                  className={inputBase}
                  placeholder="Ej: Terraza Panorámica"
                  value={data.name}
                  maxLength={60}
                  onChange={(e) => {
                    updateData({ name: e.target.value });
                    if (errors.name) setErrors((p) => ({ ...p, name: '' }));
                  }}
                  onBlur={(e) => {
                    const msg = validateSpaceName(e.target.value);
                    if (msg) setErrors((p) => ({ ...p, name: msg }));
                  }}
                />
                <div className="flex justify-between items-center">
                  <ErrorMessage message={errors.name} />
                  <span className="text-[10px] text-slate-400 ml-auto">{data.name.length}/60</span>
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
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Tamaño (m²) — opcional</label>
                <input
                  className={inputBase}
                  type="number"
                  min={1}
                  step={1}
                  placeholder="Ej: 350"
                  value={data.sizeSqm}
                  onKeyDown={(e) => { if (e.key === '-' || e.key === 'e' || e.key === '+') e.preventDefault(); }}
                  onChange={(e) => {
                    const v = e.target.value.replace(/[^0-9]/g, '');
                    updateData({ sizeSqm: v });
                  }}
                />
                <ErrorMessage message={errors.sizeSqm} />
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
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Política de cancelación</label>
                <p className="text-[11px] text-slate-400 leading-snug ml-1 mb-2">Define qué pasa si el usuario cancela su reserva.</p>
                <div className="space-y-3">
                  {([
                    { key: 'non_refundable', title: 'No reembolsable', desc: 'El usuario puede cancelar, pero no recibe reembolso.' },
                    { key: 'flexible', title: 'Flexible', desc: 'Reembolso del 100% si cancela con cierta anticipación.' },
                    { key: 'custom', title: 'Personalizada', desc: 'Define tus propios porcentajes por anticipación.' },
                  ] as const).map((opt) => {
                    const active = data.cancellationType === opt.key;
                    return (
                      <label
                        key={opt.key}
                        className={`flex items-start gap-3 p-4 rounded-2xl cursor-pointer border transition-all ${
                          active ? 'bg-primary/10 border-primary' : 'bg-slate-50 dark:bg-slate-800/50 border-transparent'
                        }`}
                      >
                        <input
                          type="radio"
                          className="accent-primary mt-1"
                          checked={active}
                          onChange={() => updateData({ cancellationType: opt.key })}
                        />
                        <span className="flex-1">
                          <span className="block text-xs font-bold text-slate-800 dark:text-white">{opt.title}</span>
                          <span className="block text-[11px] text-slate-500 dark:text-slate-400 leading-snug mt-0.5">{opt.desc}</span>
                        </span>
                      </label>
                    );
                  })}
                </div>

                {data.cancellationType === 'flexible' && (
                  <div className="mt-3 space-y-2">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Cancelación gratuita hasta</label>
                    <div className="flex flex-wrap gap-2">
                      {FLEXIBLE_DAY_OPTIONS.map((d) => (
                        <button
                          key={d}
                          type="button"
                          onClick={() => updateData({ cancellationDays: String(d) })}
                          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                            Number(data.cancellationDays) === d
                              ? 'bg-primary text-white'
                              : 'bg-slate-50 dark:bg-slate-800/50 text-slate-600 dark:text-slate-300'
                          }`}
                        >
                          {d} días
                        </button>
                      ))}
                    </div>
                    <p className="text-[11px] text-slate-400 ml-1">
                      Cancelación gratuita hasta {Number(data.cancellationDays) || 30} días antes. Dentro de ese plazo, sin reembolso.
                    </p>
                  </div>
                )}

                {data.cancellationType === 'custom' && (
                  <div className="mt-3 space-y-3">
                    {data.cancellationTiers.map((t, i) => (
                      <div key={i} className="flex items-center gap-2">
                        <input
                          className={`${inputBase} !py-3 flex-1`}
                          inputMode="numeric"
                          placeholder="Días"
                          value={t.days}
                          onChange={(e) => {
                            const v = e.target.value.replace(/[^0-9]/g, '');
                            updateData({ cancellationTiers: data.cancellationTiers.map((x, j) => j === i ? { ...x, days: v } : x) });
                          }}
                        />
                        <input
                          className={`${inputBase} !py-3 flex-1`}
                          inputMode="numeric"
                          placeholder="% reembolso"
                          value={t.percent}
                          onChange={(e) => {
                            const v = e.target.value.replace(/[^0-9]/g, '').slice(0, 3);
                            updateData({ cancellationTiers: data.cancellationTiers.map((x, j) => j === i ? { ...x, percent: v } : x) });
                          }}
                        />
                        <button
                          type="button"
                          onClick={() => updateData({ cancellationTiers: data.cancellationTiers.filter((_, j) => j !== i) })}
                          className="p-2 text-slate-400 hover:text-red-500 transition-colors"
                        >
                          <span className="material-icons-outlined text-[20px]">delete</span>
                        </button>
                      </div>
                    ))}
                    <button
                      type="button"
                      onClick={() => updateData({ cancellationTiers: [...data.cancellationTiers, { days: '', percent: '' }] })}
                      className="text-xs font-bold text-primary flex items-center gap-1"
                    >
                      <span className="material-icons-outlined text-[18px]">add</span> Agregar condición
                    </button>
                    <p className="text-[11px] text-slate-400 ml-1">
                      Ejemplo: 60 días → 100%, 30 días → 50%. Fuera de estos plazos no hay reembolso.
                    </p>
                  </div>
                )}
                <ErrorMessage message={errors.cancellation} />
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Servicios incluidos en el espacio</label>
                <p className="text-[11px] text-slate-400 leading-snug ml-1 mb-2">Selecciona todo lo que el espacio ofrece sin costo extra.</p>
                <div className="grid grid-cols-2 gap-3">
                  {AMENITIES.map((a) => {
                    const checked = data.amenities.includes(a.key);
                    return (
                      <label
                        key={a.key}
                        className={`flex items-center gap-2 p-3 rounded-xl cursor-pointer border transition-all ${
                          checked
                            ? 'bg-primary/10 border-primary'
                            : 'bg-slate-50 dark:bg-slate-800/50 border-transparent'
                        }`}
                      >
                        <input
                          type="checkbox"
                          className="accent-primary"
                          checked={checked}
                          onChange={() => toggleAmenity(a.key)}
                        />
                        <span className="material-icons-outlined text-secondary text-[18px]">{a.icon}</span>
                        <span className="text-xs font-medium text-slate-700 dark:text-slate-200">{a.label}</span>
                      </label>
                    );
                  })}
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
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Ciudad</label>
                    <input className={inputBase} placeholder="CDMX" value={data.city} onChange={(e) => updateData({ city: e.target.value })} />
                    <ErrorMessage message={errors.city} />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Código postal</label>
                    <input
                      className={inputBase}
                      inputMode="numeric"
                      maxLength={10}
                      placeholder="06700"
                      value={data.postalCode}
                      onChange={(e) => updateData({ postalCode: e.target.value.replace(/[^0-9]/g, '') })}
                    />
                    <ErrorMessage message={errors.postalCode} />
                  </div>
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
              <h2 className="text-lg font-bold mb-6 dark:text-white font-display tracking-tight">Precio y capacidad</h2>
              <div className="bg-white dark:bg-surface-dark border border-slate-100 dark:border-slate-800 rounded-[32px] p-8 shadow-sm space-y-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Precio base del paquete (MXN)</label>
                  <input
                    className={inputBase}
                    type="number"
                    min={1}
                    step={1}
                    placeholder="Ej: 15000"
                    value={data.basePrice}
                    onKeyDown={(e) => { if (e.key === '-' || e.key === 'e' || e.key === '+') e.preventDefault(); }}
                    onChange={(e) => {
                      const v = e.target.value.replace(/[^0-9.]/g, '');
                      updateData({ basePrice: v });
                    }}
                  />
                  <ErrorMessage message={errors.basePrice} />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Capacidad base</label>
                    <input
                      className={inputBase}
                      type="number"
                      min={1}
                      step={1}
                      placeholder="Ej: 150"
                      value={data.baseCapacity}
                      onKeyDown={(e) => { if (e.key === '-' || e.key === 'e' || e.key === '+') e.preventDefault(); }}
                      onChange={(e) => {
                        const v = e.target.value.replace(/[^0-9]/g, '');
                        updateData({ baseCapacity: v });
                      }}
                    />
                    <ErrorMessage message={errors.baseCapacity} />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Capacidad máxima</label>
                    <input
                      className={inputBase}
                      type="number"
                      min={1}
                      step={1}
                      placeholder="Ej: 250"
                      value={data.maxCapacity}
                      onKeyDown={(e) => { if (e.key === '-' || e.key === 'e' || e.key === '+') e.preventDefault(); }}
                      onChange={(e) => {
                        const v = e.target.value.replace(/[^0-9]/g, '');
                        updateData({ maxCapacity: v });
                      }}
                    />
                    <ErrorMessage message={errors.maxCapacity} />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Horas incluidas en el paquete</label>
                  <input
                    className={inputBase}
                    type="number"
                    min={1}
                    max={24}
                    step={1}
                    placeholder="Ej: 5"
                    value={data.includedHours}
                    onKeyDown={(e) => { if (e.key === '-' || e.key === 'e' || e.key === '+') e.preventDefault(); }}
                    onChange={(e) => {
                      const v = e.target.value.replace(/[^0-9]/g, '');
                      updateData({ includedHours: v });
                    }}
                  />
                  <ErrorMessage message={errors.includedHours} />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Persona extra ($/persona/hora)</label>
                    <input
                      className={inputBase}
                      type="number"
                      min={0}
                      step={1}
                      placeholder="Ej: 20"
                      value={data.extraPersonPrice}
                      onKeyDown={(e) => { if (e.key === '-' || e.key === 'e' || e.key === '+') e.preventDefault(); }}
                      onChange={(e) => {
                        const v = e.target.value.replace(/[^0-9.]/g, '');
                        updateData({ extraPersonPrice: v });
                      }}
                    />
                    <ErrorMessage message={errors.extraPersonPrice} />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Hora extra (MXN)</label>
                    <input
                      className={inputBase}
                      type="number"
                      min={0}
                      step={1}
                      placeholder="Ej: 3000"
                      value={data.extraHourPrice}
                      onKeyDown={(e) => { if (e.key === '-' || e.key === 'e' || e.key === '+') e.preventDefault(); }}
                      onChange={(e) => {
                        const v = e.target.value.replace(/[^0-9.]/g, '');
                        updateData({ extraHourPrice: v });
                      }}
                    />
                    <ErrorMessage message={errors.extraHourPrice} />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Límite de horas extra permitidas</label>
                  <input
                    className={inputBase}
                    type="number"
                    min={0}
                    max={24}
                    step={1}
                    placeholder="Ej: 6 (por defecto 6h)"
                    value={data.maxExtraHours}
                    onKeyDown={(e) => { if (e.key === '-' || e.key === 'e' || e.key === '+') e.preventDefault(); }}
                    onChange={(e) => {
                      const v = e.target.value.replace(/[^0-9]/g, '');
                      updateData({ maxExtraHours: v });
                    }}
                  />
                  <p className="text-[11px] text-slate-400 ml-1">
                    Cantidad máxima de horas adicionales que el usuario puede solicitar en este espacio (0 para no permitir horas extra).
                  </p>
                </div>

                <div className="bg-orange-50 dark:bg-orange-900/10 border border-orange-100 dark:border-orange-900/30 rounded-2xl p-4 text-[11px] text-slate-600 dark:text-slate-300 leading-relaxed">
                  <p className="font-bold text-slate-800 dark:text-white mb-1">Ejemplo de cobro</p>
                  <p>Si tu paquete es $15,000 / 150 personas / 5h, y persona extra $20 y hora extra $3,000:</p>
                  <p className="mt-1">• 155 personas, 6 h → $15,000 + (5×$20×6) + $3,000 = <span className="font-bold">$18,600</span></p>
                </div>
              </div>
            </div>

            <div>
              <h2 className="text-lg font-bold mb-6 dark:text-white font-display tracking-tight">Horarios de turnos</h2>
              <div className="bg-white dark:bg-surface-dark border border-slate-100 dark:border-slate-800 rounded-[32px] p-8 shadow-sm space-y-6">
                <p className="text-xs text-slate-500 leading-relaxed">
                  Configura las horas exactas en las que permites reservas para cada turno. Puedes desactivar turnos si no operas en ese horario.
                </p>

                {/* Turno Mañana */}
                <div className="p-4 rounded-2xl border border-slate-100 dark:border-slate-800 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="material-icons-outlined text-amber-500 text-lg">wb_sunny</span>
                      <span className="text-sm font-bold text-slate-800 dark:text-white">Turno Mañana</span>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={data.schedules?.morning.enabled ?? true}
                        onChange={(e) => {
                          const morning = { ...(data.schedules?.morning || { start: '08:00', end: '13:00' }), enabled: e.target.checked };
                          updateData({
                            schedules: {
                              morning,
                              afternoon: data.schedules?.afternoon || { enabled: true, start: '14:00', end: '19:00' },
                              night: data.schedules?.night || { enabled: true, start: '20:00', end: '02:00' },
                            },
                          });
                        }}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                    </label>
                  </div>
                  {(data.schedules?.morning.enabled ?? true) && (
                    <div className="grid grid-cols-2 gap-3 pt-2">
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Inicio</label>
                        <input
                          type="time"
                          value={data.schedules?.morning.start || '08:00'}
                          onChange={(e) => {
                            const morning = { ...(data.schedules?.morning || { enabled: true, end: '13:00' }), start: e.target.value };
                            updateData({
                              schedules: {
                                morning,
                                afternoon: data.schedules?.afternoon || { enabled: true, start: '14:00', end: '19:00' },
                                night: data.schedules?.night || { enabled: true, start: '20:00', end: '02:00' },
                              },
                            });
                          }}
                          className={inputBase}
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Fin</label>
                        <input
                          type="time"
                          value={data.schedules?.morning.end || '13:00'}
                          onChange={(e) => {
                            const morning = { ...(data.schedules?.morning || { enabled: true, start: '08:00' }), end: e.target.value };
                            updateData({
                              schedules: {
                                morning,
                                afternoon: data.schedules?.afternoon || { enabled: true, start: '14:00', end: '19:00' },
                                night: data.schedules?.night || { enabled: true, start: '20:00', end: '02:00' },
                              },
                            });
                          }}
                          className={inputBase}
                        />
                      </div>
                    </div>
                  )}
                </div>

                {/* Turno Tarde */}
                <div className="p-4 rounded-2xl border border-slate-100 dark:border-slate-800 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="material-icons-outlined text-orange-500 text-lg">wb_twilight</span>
                      <span className="text-sm font-bold text-slate-800 dark:text-white">Turno Tarde</span>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={data.schedules?.afternoon.enabled ?? true}
                        onChange={(e) => {
                          const afternoon = { ...(data.schedules?.afternoon || { start: '14:00', end: '19:00' }), enabled: e.target.checked };
                          updateData({
                            schedules: {
                              morning: data.schedules?.morning || { enabled: true, start: '08:00', end: '13:00' },
                              afternoon,
                              night: data.schedules?.night || { enabled: true, start: '20:00', end: '02:00' },
                            },
                          });
                        }}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                    </label>
                  </div>
                  {(data.schedules?.afternoon.enabled ?? true) && (
                    <div className="grid grid-cols-2 gap-3 pt-2">
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Inicio</label>
                        <input
                          type="time"
                          value={data.schedules?.afternoon.start || '14:00'}
                          onChange={(e) => {
                            const afternoon = { ...(data.schedules?.afternoon || { enabled: true, end: '19:00' }), start: e.target.value };
                            updateData({
                              schedules: {
                                morning: data.schedules?.morning || { enabled: true, start: '08:00', end: '13:00' },
                                afternoon,
                                night: data.schedules?.night || { enabled: true, start: '20:00', end: '02:00' },
                              },
                            });
                          }}
                          className={inputBase}
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Fin</label>
                        <input
                          type="time"
                          value={data.schedules?.afternoon.end || '19:00'}
                          onChange={(e) => {
                            const afternoon = { ...(data.schedules?.afternoon || { enabled: true, start: '14:00' }), end: e.target.value };
                            updateData({
                              schedules: {
                                morning: data.schedules?.morning || { enabled: true, start: '08:00', end: '13:00' },
                                afternoon,
                                night: data.schedules?.night || { enabled: true, start: '20:00', end: '02:00' },
                              },
                            });
                          }}
                          className={inputBase}
                        />
                      </div>
                    </div>
                  )}
                </div>

                {/* Turno Noche */}
                <div className="p-4 rounded-2xl border border-slate-100 dark:border-slate-800 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="material-icons-outlined text-indigo-500 text-lg">nights_stay</span>
                      <span className="text-sm font-bold text-slate-800 dark:text-white">Turno Noche</span>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={data.schedules?.night.enabled ?? true}
                        onChange={(e) => {
                          const night = { ...(data.schedules?.night || { start: '20:00', end: '02:00' }), enabled: e.target.checked };
                          updateData({
                            schedules: {
                              morning: data.schedules?.morning || { enabled: true, start: '08:00', end: '13:00' },
                              afternoon: data.schedules?.afternoon || { enabled: true, start: '14:00', end: '19:00' },
                              night,
                            },
                          });
                        }}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                    </label>
                  </div>
                  {(data.schedules?.night.enabled ?? true) && (
                    <div className="grid grid-cols-2 gap-3 pt-2">
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Inicio</label>
                        <input
                          type="time"
                          value={data.schedules?.night.start || '20:00'}
                          onChange={(e) => {
                            const night = { ...(data.schedules?.night || { enabled: true, end: '02:00' }), start: e.target.value };
                            updateData({
                              schedules: {
                                morning: data.schedules?.morning || { enabled: true, start: '08:00', end: '13:00' },
                                afternoon: data.schedules?.afternoon || { enabled: true, start: '14:00', end: '19:00' },
                                night,
                              },
                            });
                          }}
                          className={inputBase}
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Fin</label>
                        <input
                          type="time"
                          value={data.schedules?.night.end || '02:00'}
                          onChange={(e) => {
                            const night = { ...(data.schedules?.night || { enabled: true, start: '20:00' }), end: e.target.value };
                            updateData({
                              schedules: {
                                morning: data.schedules?.morning || { enabled: true, start: '08:00', end: '13:00' },
                                afternoon: data.schedules?.afternoon || { enabled: true, start: '14:00', end: '19:00' },
                                night,
                              },
                            });
                          }}
                          className={inputBase}
                        />
                      </div>
                    </div>
                  )}
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
