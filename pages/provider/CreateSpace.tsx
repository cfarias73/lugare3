
import React, { useRef, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { CreateSpaceProvider, useCreateSpace } from '../../context/CreateSpaceContext';
import { ErrorMessage } from '../../components/ui/ErrorMessage';
import { useUser } from '../../context/UserContext';
import { createVenue } from '../../src/services/providerService';
import { getCategories, Category } from '../../src/services/categoryService';

const CreateSpaceContent: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const venueId = searchParams.get('id');
  const { data, updateData, setData, step, setStep } = useCreateSpace();
  const { user } = useUser();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [errors, setErrors] = React.useState<Record<string, string>>({});
  const [loading, setLoading] = React.useState(false);
  const [files, setFiles] = React.useState<File[]>([]);
  const [categories, setCategories] = React.useState<Category[]>([]);

  useEffect(() => {
    getCategories().then(setCategories);
  }, []);

  const handleSave = async () => {
    if (!user || user.role !== 'provider') {
      alert('Debes iniciar sesión como anfitrión');
      return;
    }
    if (files.length === 0) {
      alert('Debes subir al menos una foto');
      return;
    }
    if (!data.category) {
      alert('Debes seleccionar una categoría');
      return;
    }
    setLoading(true);
    try {
      await createVenue(user.email, {
        name: data.name,
        description: data.description,
        category: data.category,
        location: 'CDMX',
        city: 'CDMX',
        capacity: parseInt(data.capacity) || 0,
        size_sqm: 100,
        price_per_hour: 500,
        imageFile: files[0]
      });
      alert('Espacio creado con éxito');
      navigate('/provider/dashboard');
    } catch (e) {
      console.error(e);
      alert('Error al crear el espacio');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (venueId) {
      // Simulate fetching data for the venue
      const venue = {
        name: 'Casa Jardín',
        type: 'Jardín',
        capacity: '80',
        description: 'Una hermosa casa con jardín para eventos.',
        images: ['https://lh3.googleusercontent.com/aida-public/AB6AXuAwdXTHf3C9pX9-8dMVgDgxBDCTmf0AaI2tnwdqes4fBJiPNTZJ92j0t09QzWqtUIPgo35M-MtteDja5h8WolMwo_OdO5sitsYFH9pihMtihXMQMjzwk0cgTEPEpfH-4Pe1-gTA-gAByTSlapcaCvDdj6PP_dGL4u8WqeC_EB9X9BFJN_xdQUqmU8AH289TyvK1gEZ0t11Lsq1h_AqxbJT4sBKl2fFPh1ddxKSl_vgtkZFaFOkFi9KGbpW9KeKaQMQ01Dpk0VZiUvGA'],
        category: '',
      };
      setData(venue);
    }
  }, [venueId, setData]);

  const validateStep1 = () => {
    const newErrors: Record<string, string> = {};
    if (!data.name) newErrors.name = 'El nombre es requerido';
    if (!data.capacity) newErrors.capacity = 'La capacidad es requerida';
    if (!data.description) newErrors.description = 'La descripción es requerida';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleBack = () => {
    if (step > 1) setStep(step - 1);
    else navigate(-1);
  };

  const handleContinue = () => {
    if (step === 1) {
      if (validateStep1()) {
        setStep(2);
      }
    } else {
      navigate('/provider/services?wizard=true');
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const uploadedFiles = e.target.files;
    if (uploadedFiles) {
      const fileArray = Array.from(uploadedFiles);
      setFiles(prev => [...prev, ...fileArray]);
      const newImages = fileArray.map(file => URL.createObjectURL(file as Blob));
      updateData({ images: [...data.images, ...newImages] });
    }
  };

  const removeImage = (index: number) => {
    updateData({ images: data.images.filter((_, i) => i !== index) });
    setFiles(prev => prev.filter((_, i) => i !== index));
  };

  return (
    <div className="bg-background-light dark:bg-background-dark font-sans text-slate-800 dark:text-slate-100 antialiased min-h-screen flex flex-col max-w-md mx-auto relative shadow-2xl transition-colors">
      <header className="sticky top-0 z-50 bg-white/90 dark:bg-surface-dark/90 backdrop-blur-md border-b border-slate-100 dark:border-slate-800 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button onClick={handleBack} className="p-2 -ml-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors active:scale-90">
            <span className="material-icons-outlined block">arrow_back</span>
          </button>
          <h1 className="text-lg font-bold text-slate-900 dark:text-white font-display tracking-tight">Alta de Espacio</h1>
        </div>
        <button onClick={() => navigate('/provider/dashboard')} className="p-2 -mr-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors">
          <span className="material-icons-outlined block">close</span>
        </button>
      </header>

      <main className="flex-1 pb-32">
        <div className="px-6 pt-8 pb-6">
          <div className="flex justify-between items-end mb-3">
            <span className="text-sm font-bold text-slate-900 dark:text-white tracking-tight uppercase">Progreso</span>
            <span className="text-xs font-bold text-primary uppercase tracking-widest">Paso {step} de 4</span>
          </div>
          <div className="w-full h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
            <div 
              className="bg-primary h-full rounded-full transition-all duration-700 shadow-[0_0_10px_rgba(242,107,58,0.4)]" 
              style={{ width: `${(step/4)*100}%` }}
            ></div>
          </div>
        </div>

        {step === 1 && (
          <div className="animate-in fade-in slide-in-from-right-4 duration-300">
            <section className="px-6 mb-10">
              <h2 className="text-lg font-bold mb-6 dark:text-white font-display tracking-tight">Descripción del espacio</h2>
              <div className="bg-white dark:bg-surface-dark border border-slate-100 dark:border-slate-800 rounded-[32px] p-8 shadow-sm space-y-6">
                <div className="space-y-2">
                  <label htmlFor="spaceName" className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Nombre del espacio</label>
                  <input 
                    id="spaceName"
                    className="w-full bg-slate-50 dark:bg-slate-800/50 border-none rounded-2xl px-5 py-4 text-sm font-bold text-slate-900 dark:text-white focus:ring-2 focus:ring-primary outline-none transition-all" 
                    placeholder="Ej: Terraza Panorámica" 
                    type="text" 
                    value={data.name}
                    onChange={(e) => updateData({ name: e.target.value })}
                  />
                  <ErrorMessage message={errors.name} />
                </div>
                <div className="space-y-2">
                  <label htmlFor="spaceType" className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Tipo de espacio</label>
                  <div className="relative">
                    <select 
                      id="spaceType"
                      className="w-full bg-slate-50 dark:bg-slate-800/50 border-none rounded-2xl px-5 py-4 text-sm font-bold text-slate-900 dark:text-white focus:ring-2 focus:ring-primary outline-none appearance-none transition-all"
                      value={data.type}
                      onChange={(e) => updateData({ type: e.target.value })}
                    >
                      <option>Jardín</option>
                      <option>Salón</option>
                      <option>Terraza</option>
                    </select>
                    <span className="material-icons-outlined absolute right-5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">expand_more</span>
                  </div>
                </div>
                <div className="space-y-2">
                  <label htmlFor="capacity" className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Capacidad máxima</label>
                  <div className="relative">
                    <input 
                      id="capacity"
                      className="w-full bg-slate-50 dark:bg-slate-800/50 border-none rounded-2xl px-5 py-4 text-sm font-bold text-slate-900 dark:text-white focus:ring-2 focus:ring-primary outline-none transition-all pr-12" 
                      placeholder="Número de personas" 
                      type="number" 
                      value={data.capacity}
                      onChange={(e) => updateData({ capacity: e.target.value })}
                    />
                    <span className="material-icons-outlined absolute right-5 top-1/2 -translate-y-1/2 text-slate-400 text-xl">groups</span>
                  </div>
                  <ErrorMessage message={errors.capacity} />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Reglas de la casa</label>
                  <div className="grid grid-cols-2 gap-3">
                    {['No mascotas', 'No fumar', 'Horarios de silencio', 'No fiestas'].map((rule) => (
                      <label key={rule} htmlFor={`rule-${rule.replace(/\s+/g, '-').toLowerCase()}`} className="flex items-center gap-2 bg-slate-50 dark:bg-slate-800/50 p-3 rounded-xl cursor-pointer">
                        <input id={`rule-${rule.replace(/\s+/g, '-').toLowerCase()}`} type="checkbox" className="accent-primary" />
                        <span className="text-xs font-medium text-slate-700 dark:text-slate-200">{rule}</span>
                      </label>
                    ))}
                  </div>
                </div>
                <div className="space-y-2">
                  <label htmlFor="description" className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Descripción detallada</label>
                  <textarea 
                    id="description"
                    className="w-full bg-slate-50 dark:bg-slate-800/50 border-none rounded-[24px] px-6 py-5 text-sm font-medium text-slate-700 dark:text-slate-200 focus:ring-2 focus:ring-primary outline-none transition-all resize-none" 
                    placeholder="Describe las características principales de tu espacio..." 
                    rows={5}
                    value={data.description}
                    onChange={(e) => updateData({ description: e.target.value })}
                  ></textarea>
                  <ErrorMessage message={errors.description} />
                </div>
              </div>
            </section>
          </div>
        )}

        {step === 2 && (
          <div className="animate-in fade-in slide-in-from-right-4 duration-300">
            <section className="px-6 mb-10">
              <h2 className="text-lg font-bold mb-6 dark:text-white font-display tracking-tight">Fotos y Videos</h2>
              <div className="bg-white dark:bg-surface-dark border border-slate-100 dark:border-slate-800 rounded-[32px] p-6 shadow-sm mb-6 space-y-6">
                <div 
                  onClick={() => fileInputRef.current?.click()}
                  className="border-4 border-dashed border-slate-100 dark:border-slate-800 rounded-[28px] p-8 flex flex-col items-center text-center group cursor-pointer hover:border-primary/30 transition-all"
                >
                  <input 
                    type="file" 
                    ref={fileInputRef} 
                    className="hidden" 
                    multiple 
                    accept="image/*" 
                    onChange={handleFileChange} 
                  />
                  <div className="w-16 h-16 bg-orange-50 dark:bg-orange-900/20 rounded-[24px] flex items-center justify-center mb-4 text-primary group-hover:scale-110 transition-transform">
                    <span className="material-icons-outlined text-3xl">photo_camera</span>
                  </div>
                  <p className="text-sm font-bold text-slate-800 dark:text-white mb-2 tracking-tight">Sube fotos de tu espacio</p>
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mb-6 max-w-[200px]">Recomendamos al menos 5 fotos de alta calidad</p>
                  <button className="bg-primary text-white px-8 py-3 rounded-2xl text-sm font-bold shadow-lg shadow-primary/20 flex items-center gap-2 active:scale-95 transition-all">
                    <span className="material-icons-outlined text-lg">add</span>
                    Agregar fotos
                  </button>
                </div>
                
                <div className="flex gap-4 overflow-x-auto no-scrollbar py-2">
                  {data.images.map((img, i) => (
                    <div key={i} className="relative flex-shrink-0 w-28 h-28 rounded-[20px] overflow-hidden border-2 border-slate-50 dark:border-slate-800 shadow-sm group">
                      <img alt="Uploaded" className="w-full h-full object-cover transition-transform group-hover:scale-110" src={img} />
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          removeImage(i);
                        }}
                        className="absolute top-2 right-2 bg-black/60 text-white rounded-full p-1 active:scale-75 transition-all"
                      >
                        <span className="material-icons-outlined text-[16px]">close</span>
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </section>
          </div>
        )}
      </main>

      <footer className="fixed bottom-0 left-0 right-0 bg-white/95 dark:bg-surface-dark/95 backdrop-blur-xl border-t border-slate-100 dark:border-slate-800 px-6 py-6 flex gap-4 max-w-md mx-auto z-[60]">
        <button 
          onClick={handleSave}
          disabled={loading}
          className="flex-1 py-4 border-2 border-primary text-primary font-bold text-[11px] uppercase tracking-[0.15em] rounded-2xl transition-all active:scale-95 hover:bg-primary/5 disabled:opacity-50"
        >
          {loading ? 'Guardando...' : 'Guardar'}
        </button>
        <button 
          onClick={handleContinue}
          className="flex-1 py-4 bg-primary text-white font-bold text-[11px] uppercase tracking-[0.15em] rounded-2xl shadow-xl shadow-primary/20 transition-all active:scale-95 hover:bg-orange-600"
        >
          Continuar
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
