
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import ProviderLayout from '../../components/ProviderLayout';
import { useUser } from '../../context/UserContext';

const Profile: React.FC = () => {
  const [isEditing, setIsEditing] = useState(false);
  const [name, setName] = useState('Carlos Martínez');
  const [email, setEmail] = useState('carlos.martinez@gmail.com');
  const [phone, setPhone] = useState('+52 55 1234 5678');
  const [location, setLocation] = useState('Ciudad de México, México');
  const [description, setDescription] = useState('Soy Carlos, anfitrión de espacios para eventos con más de 5 años de experiencia. Ofrezco lugares únicos y acogedores con atención personalizada. Mis espacios son ideales para...');

  const { logout } = useUser();
  const navigate = useNavigate();
  const handleLogout = () => {
    logout();
    navigate('/provider/login');
  };
  const handleSave = () => {
    setIsEditing(false);
    toast.success('Perfil actualizado correctamente');
  };

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
          onClick={isEditing ? handleSave : () => setIsEditing(true)}
          className="text-secondary font-bold text-lg hover:opacity-80 active:scale-95 transition-all"
        >
          {isEditing ? 'Guardar' : 'Editar'}
        </button>
      </header>

      <div className="px-6 py-10 space-y-12 pb-10">
        <div className="flex flex-col items-center gap-5">
          <div className="relative">
            <div className="w-36 h-36 rounded-[48px] overflow-hidden border-8 border-white dark:border-slate-800 shadow-2xl rotate-3 transform group hover:rotate-0 transition-transform duration-500">
              <img 
                alt="Carlos Martínez" 
                className="w-full h-full object-cover" 
                src="https://lh3.googleusercontent.com/aida-public/AB6AXuAmRnyrCKxdTYX1OPI1gkXKrm6bpBStUidXh1dUvL7TtyAnoEkn6l2aYY3EGmilVE3oYmG8qa59XU314YhKzG38Z76XLT76133_Xu5vsOsgic0wxxY69GY7CTMUpsJOitRW0q3nRvZBN-OSmSAHENpPq_2LuZuIkx0tb_cRPVXAN-KjhUXpz-vA-pvEfXHHgU4M3DBhUQRamL-215bA-WP6yWUO6VvzxMNOqZTGL46v2-0fR0Xncgw8mYFdPsiKBmBU9opw4CQwKbfB" 
              />
            </div>
            <button className="absolute -bottom-2 -right-2 w-12 h-12 bg-primary rounded-[20px] border-4 border-white dark:border-slate-800 flex items-center justify-center shadow-lg shadow-primary/20 active:scale-90 transition-all">
              <span className="material-icons-round text-white text-2xl">photo_camera</span>
            </button>
          </div>
          <div className="text-center">
            <h2 className="text-2xl font-bold dark:text-white font-display leading-tight">Carlos Martínez</h2>
            <p className="text-slate-400 font-bold text-[10px] uppercase tracking-[0.2em] mt-2">Miembro desde 2021</p>
          </div>
        </div>

        <section>
          <div className="flex items-center justify-between mb-6 px-1">
            <h2 className="text-lg font-bold dark:text-white tracking-tight">Datos de contacto</h2>
            <span className="material-icons-round text-slate-300">edit</span>
          </div>
          <div className="bg-white dark:bg-surface-dark p-6 rounded-[32px] shadow-sm border border-slate-100 dark:border-slate-800 space-y-6">
            <div className="space-y-2">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Nombre completo</label>
              {isEditing ? (
                <input 
                  className="w-full p-5 bg-white dark:bg-slate-800 border-2 border-primary rounded-2xl text-slate-800 dark:text-white font-bold tracking-tight outline-none"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              ) : (
                <div className="w-full p-5 bg-slate-50 dark:bg-slate-800/50 rounded-2xl text-slate-800 dark:text-white font-bold tracking-tight">
                  {name}
                </div>
              )}
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Correo electrónico</label>
              {isEditing ? (
                <input 
                  className="w-full p-5 bg-white dark:bg-slate-800 border-2 border-primary rounded-2xl text-slate-800 dark:text-white font-bold tracking-tight outline-none"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              ) : (
                <div className="w-full p-5 bg-slate-50 dark:bg-slate-800/50 rounded-2xl text-slate-800 dark:text-white font-bold tracking-tight">
                  {email}
                </div>
              )}
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Teléfono</label>
              {isEditing ? (
                <input 
                  className="w-full p-5 bg-white dark:bg-slate-800 border-2 border-primary rounded-2xl text-slate-800 dark:text-white font-bold tracking-tight outline-none"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                />
              ) : (
                <div className="w-full p-5 bg-slate-50 dark:bg-slate-800/50 rounded-2xl text-slate-800 dark:text-white font-bold tracking-tight">
                  {phone}
                </div>
              )}
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Ubicación</label>
              {isEditing ? (
                <input 
                  className="w-full p-5 bg-white dark:bg-slate-800 border-2 border-primary rounded-2xl text-slate-800 dark:text-white font-bold tracking-tight outline-none"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                />
              ) : (
                <div className="w-full p-5 bg-slate-50 dark:bg-slate-800/50 rounded-2xl flex items-center justify-between group">
                  <span className="text-slate-800 dark:text-white font-bold tracking-tight">{location}</span>
                  <span className="material-icons-round text-secondary group-hover:scale-125 transition-transform">location_on</span>
                </div>
              )}
            </div>
          </div>
        </section>

        <section>
          <h2 className="text-lg font-bold mb-6 px-1 dark:text-white tracking-tight">Descripción del anfitrión</h2>
          <div className="bg-white dark:bg-surface-dark p-7 rounded-[32px] shadow-sm border border-slate-100 dark:border-slate-800">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1 block mb-4">Sobre ti y tus espacios</label>
            <div className="relative">
              {isEditing ? (
                <textarea 
                  className="w-full p-6 bg-white dark:bg-slate-800 border-2 border-primary rounded-[24px] text-slate-800 dark:text-white leading-relaxed text-sm font-medium min-h-[160px] outline-none"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  maxLength={200}
                />
              ) : (
                <div className="w-full p-6 bg-slate-50 dark:bg-slate-800/50 rounded-[24px] text-slate-600 dark:text-slate-300 leading-relaxed text-sm font-medium min-h-[160px]">
                  {description}
                </div>
              )}
              <div className="text-right mt-3 text-[10px] text-slate-400 font-bold uppercase tracking-widest">
                {description.length}/200 caracteres
              </div>
            </div>
          </div>
        </section>

        <section>
          <div className="flex items-center justify-between mb-6 px-1">
            <h2 className="text-lg font-bold dark:text-white tracking-tight">Información fiscal</h2>
            <span className="material-icons-round text-slate-300">security</span>
          </div>
          <div className="bg-white dark:bg-surface-dark p-7 rounded-[32px] shadow-sm border border-slate-100 dark:border-slate-800 space-y-7">
            <div className="space-y-2">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">RFC</label>
              <div className="w-full p-5 bg-slate-50 dark:bg-slate-800/50 rounded-2xl text-slate-800 dark:text-white font-bold tracking-tight">
                MARC860113ABC
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Razón social</label>
              <div className="w-full p-5 bg-slate-50 dark:bg-slate-800/50 rounded-2xl text-slate-800 dark:text-white font-bold tracking-tight leading-tight">
                Carlos Martínez Eventos S.A. de C.V.
              </div>
            </div>
            <div className="space-y-4">
              <div className="flex items-center justify-between px-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Constancia fiscal</label>
                <button className="text-secondary text-xs font-bold uppercase tracking-[0.15em] border-b-2 border-secondary/30">Subir nuevo</button>
              </div>
              <div className="w-full p-4 bg-slate-50 dark:bg-slate-800/50 rounded-[24px] flex items-center justify-between group hover:bg-slate-100 dark:hover:bg-slate-800 transition-all cursor-pointer">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-orange-100 dark:bg-orange-900/30 rounded-2xl flex items-center justify-center text-primary group-hover:scale-110 transition-transform">
                    <span className="material-icons-round text-2xl">picture_as_pdf</span>
                  </div>
                  <div className="max-w-[160px]">
                    <span className="text-sm font-bold text-slate-700 dark:text-slate-300 truncate block">constancia_fiscal.pdf</span>
                    <span className="text-[10px] text-slate-400 font-bold uppercase">1.2 MB</span>
                  </div>
                </div>
                <button className="w-10 h-10 flex items-center justify-center rounded-xl hover:bg-red-50 text-slate-400 hover:text-red-500 transition-all">
                  <span className="material-icons-round text-xl">delete_outline</span>
                </button>
              </div>
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
