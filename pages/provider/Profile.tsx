import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import ProviderLayout from '../../components/ProviderLayout';
import { useUser } from '../../context/UserContext';
import {
  getProfile,
  updateProfile,
  uploadAvatar,
  uploadFiscalDoc,
  ProfileData,
} from '../../src/services/profileService';
import { supabase } from '../../lib/supabaseClient';

const DEFAULT_AVATAR = 'https://api.dicebear.com/7.x/initials/svg?seed=Anfitrion';

const Profile: React.FC = () => {
  const { user, logout } = useUser();
  const navigate = useNavigate();
  const avatarInputRef = useRef<HTMLInputElement>(null);
  const fiscalInputRef = useRef<HTMLInputElement>(null);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [uploadingFiscal, setUploadingFiscal] = useState(false);

  const [form, setForm] = useState({
    name: '',
    phone: '',
    location: '',
    description: '',
    rfc: '',
    business_name: '',
  });
  const [avatarUrl, setAvatarUrl] = useState<string>('');
  const [fiscalDocUrl, setFiscalDocUrl] = useState<string>('');
  const [memberSince, setMemberSince] = useState<string>('');
  const [email, setEmail] = useState<string>('');

  // Cargar datos reales del perfil
  useEffect(() => {
    if (!user?.id) return;
    setLoading(true);
    Promise.all([
      getProfile(user.id),
      supabase.auth.getUser(),
    ])
      .then(([profile, authRes]) => {
        if (profile) {
          setForm({
            name: profile.name ?? '',
            phone: profile.phone ?? '',
            location: profile.location ?? '',
            description: profile.description ?? '',
            rfc: profile.rfc ?? '',
            business_name: profile.business_name ?? '',
          });
          setAvatarUrl(profile.avatar_url ?? '');
          setFiscalDocUrl(profile.fiscal_doc_url ?? '');
          if (profile.member_since) {
            setMemberSince(new Date(profile.member_since).getFullYear().toString());
          }
        }
        setEmail(authRes.data.user?.email ?? '');
      })
      .catch((e) => {
        console.error(e);
        toast.error('No se pudo cargar el perfil');
      })
      .finally(() => setLoading(false));
  }, [user?.id]);

  const handleLogout = async () => {
    await logout();
    navigate('/provider/login');
  };

  const handleSave = async () => {
    if (!user?.id) return;
    if (!form.name.trim()) {
      toast.error('El nombre es requerido');
      return;
    }
    setSaving(true);
    try {
      await updateProfile(user.id, form);
      setIsEditing(false);
      toast.success('Perfil actualizado');
    } catch (e: any) {
      console.error(e);
      toast.error(e.message ?? 'Error al guardar');
    } finally {
      setSaving(false);
    }
  };

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user?.id) return;
    if (file.size > 5 * 1024 * 1024) {
      toast.error('La imagen debe pesar menos de 5MB');
      return;
    }
    setUploadingAvatar(true);
    try {
      const url = await uploadAvatar(user.id, file);
      await updateProfile(user.id, { avatar_url: url });
      setAvatarUrl(url);
      toast.success('Foto actualizada');
    } catch (err: any) {
      console.error(err);
      toast.error(err.message ?? 'No se pudo subir la imagen');
    } finally {
      setUploadingAvatar(false);
      if (avatarInputRef.current) avatarInputRef.current.value = '';
    }
  };

  const handleFiscalUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user?.id) return;
    if (file.size > 10 * 1024 * 1024) {
      toast.error('El archivo debe pesar menos de 10MB');
      return;
    }
    setUploadingFiscal(true);
    try {
      const url = await uploadFiscalDoc(user.id, file);
      await updateProfile(user.id, { fiscal_doc_url: url });
      setFiscalDocUrl(url);
      toast.success('Constancia subida');
    } catch (err: any) {
      console.error(err);
      toast.error(err.message ?? 'No se pudo subir el archivo');
    } finally {
      setUploadingFiscal(false);
      if (fiscalInputRef.current) fiscalInputRef.current.value = '';
    }
  };

  const handleFiscalDelete = async () => {
    if (!user?.id) return;
    try {
      await updateProfile(user.id, { fiscal_doc_url: null });
      setFiscalDocUrl('');
      toast.success('Constancia eliminada');
    } catch (e: any) {
      toast.error(e.message ?? 'No se pudo eliminar');
    }
  };

  const inputCls =
    'w-full p-5 bg-white dark:bg-slate-800 border-2 border-primary rounded-2xl text-slate-800 dark:text-white font-bold tracking-tight outline-none';
  const readCls =
    'w-full p-5 bg-slate-50 dark:bg-slate-800/50 rounded-2xl text-slate-800 dark:text-white font-bold tracking-tight';

  if (loading) {
    return (
      <ProviderLayout>
        <div className="p-10 flex justify-center items-center min-h-[60vh]">
          <div className="animate-pulse text-slate-400 font-bold uppercase tracking-widest text-xs">
            Cargando perfil...
          </div>
        </div>
      </ProviderLayout>
    );
  }

  return (
    <ProviderLayout>
      <header className="sticky top-0 z-50 bg-white/80 dark:bg-surface-dark/80 backdrop-blur-xl px-6 py-6 flex items-center justify-between border-b border-slate-100 dark:border-slate-800">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate(-1)} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors active:scale-90">
            <span className="material-icons-round text-slate-700 dark:text-slate-200">arrow_back</span>
          </button>
          <h1 className="text-xl font-bold dark:text-white font-display">Mi Perfil</h1>
        </div>
        <button
          disabled={saving}
          onClick={isEditing ? handleSave : () => setIsEditing(true)}
          className="text-secondary font-bold text-lg hover:opacity-80 active:scale-95 transition-all disabled:opacity-50"
        >
          {saving ? 'Guardando...' : isEditing ? 'Guardar' : 'Editar'}
        </button>
      </header>

      <div className="px-6 py-10 space-y-12 pb-10">
        {/* Avatar */}
        <div className="flex flex-col items-center gap-5">
          <div className="relative">
            <div className="w-36 h-36 rounded-[48px] overflow-hidden border-8 border-white dark:border-slate-800 shadow-2xl rotate-3 transform hover:rotate-0 transition-transform duration-500 bg-slate-100">
              <img
                alt={form.name || 'Anfitrión'}
                className="w-full h-full object-cover"
                src={avatarUrl || DEFAULT_AVATAR}
              />
            </div>
            <input
              ref={avatarInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleAvatarChange}
            />
            <button
              onClick={() => avatarInputRef.current?.click()}
              disabled={uploadingAvatar}
              className="absolute -bottom-2 -right-2 w-12 h-12 bg-primary rounded-[20px] border-4 border-white dark:border-slate-800 flex items-center justify-center shadow-lg shadow-primary/20 active:scale-90 transition-all disabled:opacity-50"
            >
              <span className="material-icons-round text-white text-2xl">
                {uploadingAvatar ? 'hourglass_top' : 'photo_camera'}
              </span>
            </button>
          </div>
          <div className="text-center">
            <h2 className="text-2xl font-bold dark:text-white font-display leading-tight">
              {form.name || 'Sin nombre'}
            </h2>
            {memberSince && (
              <p className="text-slate-400 font-bold text-[10px] uppercase tracking-[0.2em] mt-2">
                Miembro desde {memberSince}
              </p>
            )}
          </div>
        </div>

        {/* Contacto */}
        <section>
          <div className="flex items-center justify-between mb-6 px-1">
            <h2 className="text-lg font-bold dark:text-white tracking-tight">Datos de contacto</h2>
            <span className="material-icons-round text-slate-300">edit</span>
          </div>
          <div className="bg-white dark:bg-surface-dark p-6 rounded-[32px] shadow-sm border border-slate-100 dark:border-slate-800 space-y-6">
            <div className="space-y-2">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Nombre completo</label>
              {isEditing ? (
                <input className={inputCls} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
              ) : (
                <div className={readCls}>{form.name || '—'}</div>
              )}
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Correo electrónico</label>
              <div className={readCls + ' opacity-70'}>{email || '—'}</div>
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Teléfono</label>
              {isEditing ? (
                <input className={inputCls} value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="+52 55 1234 5678" />
              ) : (
                <div className={readCls}>{form.phone || '—'}</div>
              )}
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Ubicación</label>
              {isEditing ? (
                <input className={inputCls} value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} placeholder="Ciudad, País" />
              ) : (
                <div className="w-full p-5 bg-slate-50 dark:bg-slate-800/50 rounded-2xl flex items-center justify-between group">
                  <span className="text-slate-800 dark:text-white font-bold tracking-tight">{form.location || '—'}</span>
                  <span className="material-icons-round text-secondary">location_on</span>
                </div>
              )}
            </div>
          </div>
        </section>

        {/* Descripción */}
        <section>
          <h2 className="text-lg font-bold mb-6 px-1 dark:text-white tracking-tight">Descripción del anfitrión</h2>
          <div className="bg-white dark:bg-surface-dark p-7 rounded-[32px] shadow-sm border border-slate-100 dark:border-slate-800">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1 block mb-4">Sobre ti y tus espacios</label>
            <div className="relative">
              {isEditing ? (
                <textarea
                  className="w-full p-6 bg-white dark:bg-slate-800 border-2 border-primary rounded-[24px] text-slate-800 dark:text-white leading-relaxed text-sm font-medium min-h-[160px] outline-none"
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  maxLength={500}
                  placeholder="Cuenta a tus huéspedes quién eres y qué hace especiales tus espacios..."
                />
              ) : (
                <div className="w-full p-6 bg-slate-50 dark:bg-slate-800/50 rounded-[24px] text-slate-600 dark:text-slate-300 leading-relaxed text-sm font-medium min-h-[160px]">
                  {form.description || 'Aún no agregas una descripción.'}
                </div>
              )}
              <div className="text-right mt-3 text-[10px] text-slate-400 font-bold uppercase tracking-widest">
                {form.description.length}/500 caracteres
              </div>
            </div>
          </div>
        </section>

        {/* Fiscal */}
        <section>
          <div className="flex items-center justify-between mb-6 px-1">
            <h2 className="text-lg font-bold dark:text-white tracking-tight">Información fiscal</h2>
            <span className="material-icons-round text-slate-300">security</span>
          </div>
          <div className="bg-white dark:bg-surface-dark p-7 rounded-[32px] shadow-sm border border-slate-100 dark:border-slate-800 space-y-7">
            <div className="space-y-2">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">RFC</label>
              {isEditing ? (
                <input className={inputCls} value={form.rfc} onChange={(e) => setForm({ ...form, rfc: e.target.value.toUpperCase() })} placeholder="ABCD000000XYZ" maxLength={13} />
              ) : (
                <div className={readCls}>{form.rfc || '—'}</div>
              )}
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Razón social</label>
              {isEditing ? (
                <input className={inputCls} value={form.business_name} onChange={(e) => setForm({ ...form, business_name: e.target.value })} />
              ) : (
                <div className={readCls}>{form.business_name || '—'}</div>
              )}
            </div>
            <div className="space-y-4">
              <div className="flex items-center justify-between px-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Constancia fiscal</label>
                <input
                  ref={fiscalInputRef}
                  type="file"
                  accept="application/pdf,image/*"
                  className="hidden"
                  onChange={handleFiscalUpload}
                />
                <button
                  onClick={() => fiscalInputRef.current?.click()}
                  disabled={uploadingFiscal}
                  className="text-secondary text-xs font-bold uppercase tracking-[0.15em] border-b-2 border-secondary/30 disabled:opacity-50"
                >
                  {uploadingFiscal ? 'Subiendo...' : fiscalDocUrl ? 'Reemplazar' : 'Subir'}
                </button>
              </div>
              {fiscalDocUrl ? (
                <div className="w-full p-4 bg-slate-50 dark:bg-slate-800/50 rounded-[24px] flex items-center justify-between group hover:bg-slate-100 dark:hover:bg-slate-800 transition-all">
                  <a href={fiscalDocUrl} target="_blank" rel="noreferrer" className="flex items-center gap-4 flex-1 min-w-0">
                    <div className="w-12 h-12 bg-orange-100 dark:bg-orange-900/30 rounded-2xl flex items-center justify-center text-primary group-hover:scale-110 transition-transform shrink-0">
                      <span className="material-icons-round text-2xl">picture_as_pdf</span>
                    </div>
                    <div className="min-w-0">
                      <span className="text-sm font-bold text-slate-700 dark:text-slate-300 truncate block">Ver constancia</span>
                      <span className="text-[10px] text-slate-400 font-bold uppercase">Documento subido</span>
                    </div>
                  </a>
                  <button onClick={handleFiscalDelete} className="w-10 h-10 flex items-center justify-center rounded-xl hover:bg-red-50 text-slate-400 hover:text-red-500 transition-all">
                    <span className="material-icons-round text-xl">delete_outline</span>
                  </button>
                </div>
              ) : (
                <div className="w-full p-5 bg-slate-50 dark:bg-slate-800/50 rounded-[24px] text-center text-xs text-slate-400 font-bold uppercase tracking-widest">
                  Sin documento
                </div>
              )}
            </div>
          </div>
        </section>

        <div className="pt-6">
          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-3 p-5 text-red-500 font-bold bg-red-50 dark:bg-red-950/20 rounded-[24px] shadow-sm hover:bg-red-100 transition-all active:scale-95 uppercase tracking-widest text-xs"
          >
            <span className="material-icons-round">logout</span>
            Cerrar sesión
          </button>
        </div>
      </div>
    </ProviderLayout>
  );
};

export default Profile;
