
import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../../components/Layout';
import { toast } from 'sonner';
import { supabase } from '../../lib/supabaseClient';

const DEFAULT_AVATAR = 'https://lh3.googleusercontent.com/aida-public/AB6AXuCAkY7AviIRiCpv8Koe6LoTyPAt1AJqCGkHEjpFdo4D8JlpGdzUheoCp65Ss2T4-6h5KivvUSvZTqKeC7TsGwEjRb7Oz4do6MpDaKU2HIAu8ZHw7Ohu2ZqkuaCgIOwbm-7nMP_2Rrlf2f1OmMl58h1G4x13DAmAb-De3dxfsK6EPpaol91SSNHQm1YRIwDjPQ36zWMi5cCqel-vSp5_fr14NVk8YSKipiYZwaPbKnTijIAfYrFYafCkd1TLCs1HI5yIgudbnm9F9spC';

const FIELD_LABELS: Record<string, string> = {
  name: 'Nombre completo',
  email: 'Correo electrónico',
  phone: 'Teléfono',
  location: 'Ubicación',
};

const LANGUAGES = ['Español', 'English', 'Português', 'Français'];

const Profile: React.FC = () => {
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [isEditing, setIsEditing] = useState(false);
  const [avatar, setAvatar] = useState<string>(() => {
    return localStorage.getItem('user_avatar') || DEFAULT_AVATAR;
  });
  const [formData, setFormData] = useState(() => {
    const stored = localStorage.getItem('user_profile');
    return stored ? JSON.parse(stored) : {
      name: 'María Fernández',
      email: 'maria.fernandez@gmail.com',
      phone: '+54 11 5678-9012',
      location: 'Buenos Aires, Argentina',
    };
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [language, setLanguage] = useState<string>(() => localStorage.getItem('user_language') || 'Español');
  const [showLangModal, setShowLangModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [notifications, setNotifications] = useState(() => {
    const stored = localStorage.getItem('user_notifications');
    return stored ? JSON.parse(stored) : { email: true, push: true, promos: false };
  });

  useEffect(() => { localStorage.setItem('user_notifications', JSON.stringify(notifications)); }, [notifications]);

  const validate = () => {
    const newErrors: Record<string, string> = {};
    if (!formData.name.trim()) newErrors.name = 'Nombre requerido';
    if (!formData.email.includes('@')) newErrors.email = 'Correo inválido';
    if (formData.phone.length < 8) newErrors.phone = 'Teléfono inválido';
    if (!formData.location.trim()) newErrors.location = 'Ubicación requerida';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = () => {
    if (validate()) {
      localStorage.setItem('user_profile', JSON.stringify(formData));
      setIsEditing(false);
      toast.success('Perfil actualizado');
    } else {
      toast.error('Revisa los campos marcados');
    }
  };

  const handleAvatarClick = () => {
    fileInputRef.current?.click();
  };

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      toast.error('Selecciona un archivo de imagen');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error('La imagen debe pesar menos de 5MB');
      return;
    }
    const reader = new FileReader();
    reader.onload = (ev) => {
      const dataUrl = ev.target?.result as string;
      setAvatar(dataUrl);
      localStorage.setItem('user_avatar', dataUrl);
      toast.success('Foto actualizada');
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const handleRemoveAvatar = () => {
    setAvatar(DEFAULT_AVATAR);
    localStorage.removeItem('user_avatar');
    toast.success('Foto restablecida');
  };

  const handleLanguageSelect = (lang: string) => {
    setLanguage(lang);
    localStorage.setItem('user_language', lang);
    setShowLangModal(false);
    toast.success(`Idioma: ${lang}`);
  };

  const [isDeleting, setIsDeleting] = useState(false);

  const handleDeleteAccount = async () => {
    setIsDeleting(true);
    try {
      const { error } = await supabase.rpc('delete_my_account');
      if (error) throw error;
      await supabase.auth.signOut();
      localStorage.removeItem('user_profile');
      localStorage.removeItem('user_avatar');
      localStorage.removeItem('user_notifications');
      localStorage.removeItem('user_language');
      toast.success('Cuenta eliminada');
      setShowDeleteConfirm(false);
      navigate('/user/login');
    } catch (err: any) {
      toast.error(err?.message || 'No se pudo eliminar la cuenta');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <Layout>
      <header className="sticky top-0 z-10 bg-white/80 dark:bg-background-dark/80 backdrop-blur-md px-4 py-4 flex items-center justify-between">
        <h1 className="text-xl font-bold text-slate-800 dark:text-white">Mi Perfil</h1>
        <button onClick={() => isEditing ? handleSave() : setIsEditing(true)} className="text-primary font-bold">
          {isEditing ? 'Guardar' : 'Editar'}
        </button>
      </header>

      <div className="px-4 space-y-6 pb-6">
        <section className="flex flex-col items-center pt-2">
          <div className="relative">
            <button
              type="button"
              onClick={handleAvatarClick}
              className="block w-24 h-24 rounded-full border-4 border-white dark:border-slate-800 overflow-hidden shadow-lg active:scale-95 transition-transform"
              aria-label="Cambiar foto de perfil"
            >
              <img alt="Profile" className="w-full h-full object-cover" src={avatar} loading="lazy" />
            </button>
            <button
              type="button"
              onClick={handleAvatarClick}
              className="absolute -bottom-1 -right-1 w-9 h-9 bg-primary rounded-full border-4 border-white dark:border-slate-800 flex items-center justify-center shadow-md active:scale-90 transition-transform"
              aria-label="Subir nueva foto"
            >
              <span className="material-icons-round text-white text-base">photo_camera</span>
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleAvatarChange}
            />
          </div>
          {avatar !== DEFAULT_AVATAR && (
            <button
              onClick={handleRemoveAvatar}
              className="mt-3 text-xs text-slate-500 dark:text-slate-400 underline"
            >
              Quitar foto
            </button>
          )}
          <div className="mt-4 text-center">
            <h2 className="text-xl font-semibold text-slate-800 dark:text-white">{formData.name}</h2>
            <p className="text-slate-500 dark:text-slate-400 text-sm">{formData.email}</p>
          </div>
        </section>

        <section className="space-y-4">
          <h3 className="text-lg font-bold text-slate-800 dark:text-white">Datos Personales</h3>
          <div className="bg-white dark:bg-surface-dark rounded-xl border border-slate-100 dark:border-slate-800 shadow-sm p-4 space-y-4">
            {Object.entries(formData).map(([key, value]) => (
              <div key={key}>
                <label className="text-xs text-slate-400 uppercase font-bold">{FIELD_LABELS[key] || key}</label>
                <input
                  disabled={!isEditing}
                  value={value as string}
                  onChange={(e) => setFormData({ ...formData, [key]: e.target.value })}
                  className={`w-full p-2 rounded-lg border ${errors[key] ? 'border-red-500' : 'border-slate-200 dark:border-slate-700'} dark:bg-slate-800 dark:text-white disabled:bg-slate-50 dark:disabled:bg-slate-900/40`}
                />
                {errors[key] && <p className="text-red-500 text-xs mt-1">{errors[key]}</p>}
              </div>
            ))}
          </div>
        </section>

        {/* Tarjeta de Idioma oculta por ahora */}

        <section className="space-y-4">
          <h3 className="text-lg font-bold text-slate-800 dark:text-white">Notificaciones</h3>
          <div className="bg-white dark:bg-surface-dark rounded-xl border border-slate-100 dark:border-slate-800 divide-y divide-slate-100 dark:divide-slate-800 shadow-sm overflow-hidden">
            {([
              { key: 'email', title: 'Correo electrónico', desc: 'Recibe actualizaciones por email' },
              { key: 'push', title: 'Notificaciones push', desc: 'Alertas importantes en tu dispositivo' },
              { key: 'promos', title: 'Promociones y ofertas', desc: 'Recibe descuentos especiales' },
            ] as const).map((item) => (
              <div key={item.key} className="p-4 flex items-center justify-between">
                <div>
                  <p className="font-medium text-slate-800 dark:text-white">{item.title}</p>
                  <p className="text-xs text-slate-400">{item.desc}</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={notifications[item.key]}
                    onChange={(e) => setNotifications({ ...notifications, [item.key]: e.target.checked })}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none dark:bg-slate-700 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                </label>
              </div>
            ))}
          </div>
        </section>

        <section className="space-y-2 pt-4">
          <button
            onClick={() => navigate('/user/login')}
            className="w-full flex items-center gap-3 p-4 text-red-500 font-medium bg-red-50 dark:bg-red-900/10 rounded-xl active:scale-[0.99] transition-transform"
          >
            <span className="material-icons-round">logout</span>
            Cerrar sesión
          </button>
          <button
            onClick={() => setShowDeleteConfirm(true)}
            className="w-full flex items-center gap-3 p-4 text-slate-500 dark:text-slate-400 font-medium hover:text-red-500 transition-colors"
          >
            <span className="material-icons-round">delete_outline</span>
            Eliminar cuenta
          </button>
        </section>
      </div>

      {showLangModal && (
        <div
          className="fixed inset-0 z-50 bg-black/50 flex items-end sm:items-center justify-center p-4"
          onClick={() => setShowLangModal(false)}
        >
          <div
            className="bg-white dark:bg-surface-dark rounded-2xl w-full max-w-sm overflow-hidden shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-4 border-b border-slate-100 dark:border-slate-800">
              <h3 className="font-bold text-slate-800 dark:text-white">Selecciona un idioma</h3>
            </div>
            <div className="divide-y divide-slate-100 dark:divide-slate-800">
              {LANGUAGES.map((lang) => (
                <button
                  key={lang}
                  onClick={() => handleLanguageSelect(lang)}
                  className="w-full p-4 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-800/50"
                >
                  <span className="text-slate-800 dark:text-white font-medium">{lang}</span>
                  {language === lang && <span className="material-icons-round text-primary">check</span>}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {showDeleteConfirm && (
        <div
          className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4"
          onClick={() => setShowDeleteConfirm(false)}
        >
          <div
            className="bg-white dark:bg-surface-dark rounded-2xl w-full max-w-sm p-6 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-center w-14 h-14 bg-red-100 dark:bg-red-900/30 rounded-full mx-auto mb-4">
              <span className="material-icons-round text-red-500 text-3xl">warning</span>
            </div>
            <h3 className="text-lg font-bold text-center text-slate-800 dark:text-white mb-2">¿Eliminar cuenta?</h3>
            <p className="text-sm text-slate-500 dark:text-slate-400 text-center mb-6">
              Esta acción es permanente. Perderás todos tus datos, reservas y mensajes.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="flex-1 p-3 rounded-xl border border-slate-200 dark:border-slate-700 font-medium text-slate-700 dark:text-slate-200"
              >
                Cancelar
              </button>
              <button
                onClick={handleDeleteAccount}
                disabled={isDeleting}
                className="flex-1 p-3 rounded-xl bg-red-500 text-white font-medium disabled:opacity-60"
              >
                {isDeleting ? 'Eliminando…' : 'Eliminar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
};

export default Profile;
