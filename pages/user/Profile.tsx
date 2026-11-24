import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../../components/Layout';
import { toast } from 'sonner';
import { supabase } from '../../lib/supabaseClient';
import { useUser } from '../../context/UserContext';
import { getProfile, updateProfile, uploadAvatar } from '../../src/services/profileService';
import { getInitialsAvatar } from '../../src/utils/avatar';

const FIELD_LABELS: Record<string, string> = {
  name: 'Nombre completo',
  email: 'Correo electrónico',
  phone: 'Teléfono',
  location: 'Ubicación',
};

const LANGUAGES = ['Español', 'English', 'Português', 'Français'];

const Profile: React.FC = () => {
  const navigate = useNavigate();
  const { user, authReady, logout, updateName } = useUser();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [avatar, setAvatar] = useState<string>('');
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    location: '',
  });

  const PLACEHOLDERS: Record<string, string> = {
    name: 'Ej. Juan Pérez',
    email: 'Ej. juan.perez@gmail.com',
    phone: 'Ej. +52 55 1234 5678',
    location: 'Ej. Ciudad de México, México',
  };

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [language, setLanguage] = useState<string>('Español');
  const [showLangModal, setShowLangModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [notifications, setNotifications] = useState({ email: true, push: true, promos: false });

  // Si no está autenticado una vez listo el estado de auth, redirigir
  useEffect(() => {
    if (authReady && !user) {
      navigate('/user/login', { replace: true });
    }
  }, [authReady, user, navigate]);

  // Cargar datos reales del perfil desde Supabase
  useEffect(() => {
    if (!user?.id) {
      if (authReady) setLoading(false);
      return;
    }

    setLoading(true);
    Promise.all([
      getProfile(user.id),
      supabase.auth.getUser(),
    ])
      .then(([profile, authRes]) => {
        const emailVal = authRes.data.user?.email || user.email || '';
        if (profile) {
          setFormData({
            name: profile.name ?? user.name ?? '',
            email: emailVal,
            phone: profile.phone ?? '',
            location: profile.location ?? '',
          });
          if (profile.avatar_url) {
            setAvatar(profile.avatar_url);
          }
        } else {
          setFormData({
            name: user.name ?? '',
            email: emailVal,
            phone: '',
            location: '',
          });
        }
      })
      .catch((err) => {
        console.error('Error loading profile:', err);
        toast.error('No se pudo cargar el perfil');
      })
      .finally(() => {
        setLoading(false);
      });
  }, [user?.id, authReady]);

  const validate = () => {
    const newErrors: Record<string, string> = {};
    if (!formData.name.trim()) newErrors.name = 'Nombre requerido';
    if (formData.email && !formData.email.includes('@')) newErrors.email = 'Correo inválido';
    if (formData.phone && formData.phone.trim().length > 0 && formData.phone.trim().length < 8) {
      newErrors.phone = 'Teléfono inválido (mínimo 8 dígitos)';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = async () => {
    if (!validate()) {
      toast.error('Revisa los campos marcados');
      return;
    }
    if (!user?.id) return;

    setSaving(true);
    try {
      await updateProfile(user.id, {
        name: formData.name.trim(),
        phone: formData.phone.trim(),
        location: formData.location.trim(),
      });
      updateName(formData.name.trim());
      setIsEditing(false);
      toast.success('Perfil actualizado');
    } catch (err: any) {
      console.error('Error updating profile:', err);
      toast.error(err.message || 'Error al actualizar el perfil');
    } finally {
      setSaving(false);
    }
  };

  const handleAvatarClick = () => {
    fileInputRef.current?.click();
  };

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      toast.error('Selecciona un archivo de imagen');
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      toast.error('La imagen debe pesar menos de 10MB');
      return;
    }
    if (!user?.id) return;

    try {
      const publicUrl = await uploadAvatar(user.id, file);
      await updateProfile(user.id, { avatar_url: publicUrl });
      setAvatar(publicUrl);
      toast.success('Foto actualizada');
    } catch (err: any) {
      console.error('Error uploading avatar:', err);
      toast.error(err?.message || 'No se pudo subir la imagen');
    }
  };

  const handleRemoveAvatar = async () => {
    if (!user?.id) return;
    try {
      await updateProfile(user.id, { avatar_url: null });
      setAvatar('');
      toast.success('Foto restablecida');
    } catch (err: any) {
      console.error('Error resetting avatar:', err);
      toast.error('Error al restablecer la foto');
    }
  };

  const handleLanguageSelect = (lang: string) => {
    setLanguage(lang);
    setShowLangModal(false);
    toast.success(`Idioma: ${lang}`);
  };

  const [isDeleting, setIsDeleting] = useState(false);

  const handleLogout = async () => {
    try {
      await logout();
      toast.success('Sesión cerrada');
    } catch (e) {
      console.error('Logout error:', e);
    } finally {
      navigate('/user/login', { replace: true });
    }
  };

  const handleDeleteAccount = async () => {
    setIsDeleting(true);
    try {
      const { error } = await supabase.rpc('delete_my_account');
      if (error) throw error;
      await logout();
      toast.success('Cuenta eliminada');
      setShowDeleteConfirm(false);
      navigate('/user/login', { replace: true });
    } catch (err: any) {
      console.error('Account deletion failed:', err);
      toast.error('No se pudo eliminar tu cuenta. Inténtalo de nuevo; si continúa, contacta a soporte.');
    } finally {
      setIsDeleting(false);
    }
  };

  if (!authReady || (loading && !formData.email)) {
    return (
      <Layout>
        <div className="min-h-[60vh] flex items-center justify-center">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
        </div>
      </Layout>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <Layout>
      <header className="sticky top-0 z-10 bg-white/80 dark:bg-background-dark/80 backdrop-blur-md px-4 pt-[calc(env(safe-area-inset-top,0px)+1rem)] pb-4 flex items-center justify-between">
        <h1 className="text-xl font-bold text-slate-800 dark:text-white">Mi Perfil</h1>
        <button 
          onClick={() => isEditing ? handleSave() : setIsEditing(true)} 
          disabled={saving}
          className="text-primary font-bold disabled:opacity-50"
        >
          {saving ? 'Guardando…' : isEditing ? 'Guardar' : 'Editar'}
        </button>
      </header>

      <div className="px-4 space-y-6 pb-6">
        <section className="flex flex-col items-center pt-2">
          <div className="relative">
            <button
              type="button"
              onClick={handleAvatarClick}
              className="block w-24 h-24 rounded-full border-4 border-white dark:border-slate-800 overflow-hidden shadow-lg active:scale-95 transition-transform bg-slate-100"
              aria-label="Cambiar foto de perfil"
            >
              <img 
                alt="Profile" 
                className="w-full h-full object-cover" 
                src={avatar || getInitialsAvatar(formData.name || user?.name, 'Usuario')} 
                loading="lazy" 
              />
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
          {avatar && (
            <button
              onClick={handleRemoveAvatar}
              className="mt-3 text-xs text-slate-500 dark:text-slate-400 underline"
            >
              Quitar foto
            </button>
          )}
          <div className="mt-4 text-center">
            <h2 className="text-xl font-semibold text-slate-800 dark:text-white">{formData.name || 'Tu nombre'}</h2>
            <p className="text-slate-500 dark:text-slate-400 text-sm">{formData.email || 'tu@correo.com'}</p>
          </div>
        </section>

        <section className="space-y-4">
          <h3 className="text-lg font-bold text-slate-800 dark:text-white">Datos Personales</h3>
          <div className="bg-white dark:bg-surface-dark rounded-xl border border-slate-100 dark:border-slate-800 shadow-sm p-4 space-y-4">
            {Object.entries(formData).map(([key, value]) => (
              <div key={key}>
                <label className="text-xs text-slate-400 uppercase font-bold">{FIELD_LABELS[key] || key}</label>
                <input
                  disabled={!isEditing || key === 'email'}
                  value={value as string}
                  onChange={(e) => setFormData({ ...formData, [key]: e.target.value })}
                  placeholder={PLACEHOLDERS[key]}
                  className={`w-full p-2 rounded-lg border ${errors[key] ? 'border-red-500' : 'border-slate-200 dark:border-slate-700'} dark:bg-slate-800 dark:text-white disabled:bg-slate-50 dark:disabled:bg-slate-900/40 placeholder:text-slate-300 dark:placeholder:text-slate-600`}
                />
                {errors[key] && <p className="text-red-500 text-xs mt-1">{errors[key]}</p>}
              </div>
            ))}
          </div>
        </section>

        <section className="space-y-4">
          <h3 className="text-lg font-bold text-slate-800 dark:text-white">Mi actividad</h3>
          <div className="bg-white dark:bg-surface-dark rounded-xl border border-slate-100 dark:border-slate-800 shadow-sm divide-y divide-slate-100 dark:divide-slate-800 overflow-hidden">
            <button
              onClick={() => navigate('/user/favorites')}
              className="w-full flex items-center gap-4 p-4 text-left hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
            >
              <div className="w-10 h-10 rounded-xl bg-red-50 dark:bg-red-900/20 flex items-center justify-center">
                <span className="material-icons-outlined text-red-500">favorite</span>
              </div>
              <div className="flex-1">
                <p className="font-semibold text-slate-800 dark:text-white">Mis favoritos</p>
                <p className="text-xs text-slate-400">Espacios que guardaste con corazón</p>
              </div>
              <span className="material-icons-outlined text-slate-400">chevron_right</span>
            </button>
            <button
              onClick={() => navigate('/user/bookings')}
              className="w-full flex items-center gap-4 p-4 text-left hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
            >
              <div className="w-10 h-10 rounded-xl bg-yellow-50 dark:bg-yellow-900/20 flex items-center justify-center">
                <span className="material-icons-outlined text-yellow-500">star</span>
              </div>
              <div className="flex-1">
                <p className="font-semibold text-slate-800 dark:text-white">Valorar experiencias</p>
                <p className="text-xs text-slate-400">Califica los lugares que ya visitaste</p>
              </div>
              <span className="material-icons-outlined text-slate-400">chevron_right</span>
            </button>
            <button
              onClick={() => navigate('/user/bookings')}
              className="w-full flex items-center gap-4 p-4 text-left hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
            >
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                <span className="material-icons-outlined text-primary">event_note</span>
              </div>
              <div className="flex-1">
                <p className="font-semibold text-slate-800 dark:text-white">Mis reservas</p>
                <p className="text-xs text-slate-400">Próximas y pasadas</p>
              </div>
              <span className="material-icons-outlined text-slate-400">chevron_right</span>
            </button>
          </div>
        </section>

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
            onClick={handleLogout}
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
