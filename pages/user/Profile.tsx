
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../../components/Layout';
import { toast } from 'sonner';

const Profile: React.FC = () => {
  const navigate = useNavigate();
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    name: 'María Fernández',
    email: 'maria.fernandez@gmail.com',
    phone: '+54 11 5678-9012',
    location: 'Buenos Aires, Argentina'
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

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
      setIsEditing(false);
      toast.success('Perfil actualizado');
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
            <div className="w-24 h-24 rounded-full border-4 border-white dark:border-slate-800 overflow-hidden shadow-lg">
              <img 
                alt="Profile" 
                className="w-full h-full object-cover" 
                src="https://lh3.googleusercontent.com/aida-public/AB6AXuCAkY7AviIRiCpv8Koe6LoTyPAt1AJqCGkHEjpFdo4D8JlpGdzUheoCp65Ss2T4-6h5KivvUSvZTqKeC7TsGwEjRb7Oz4do6MpDaKU2HIAu8ZHw7Ohu2ZqkuaCgIOwbm-7nMP_2Rrlf2f1OmMl58h1G4x13DAmAb-De3dxfsK6EPpaol91SSNHQm1YRIwDjPQ36zWMi5cCqel-vSp5_fr14NVk8YSKipiYZwaPbKnTijIAfYrFYafCkd1TLCs1HI5yIgudbnm9F9spC" 
                loading="lazy"
              />
            </div>
          </div>
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
                <label className="text-xs text-slate-400 uppercase font-bold">{key}</label>
                <input
                  disabled={!isEditing}
                  value={value}
                  onChange={(e) => setFormData({...formData, [key]: e.target.value})}
                  className={`w-full p-2 rounded-lg border ${errors[key] ? 'border-red-500' : 'border-slate-200 dark:border-slate-700'} dark:bg-slate-800 dark:text-white`}
                />
                {errors[key] && <p className="text-red-500 text-xs mt-1">{errors[key]}</p>}
              </div>
            ))}
          </div>
        </section>

        {/* Payment Methods Section Hidden */}

        <section className="space-y-4">
          <h3 className="text-lg font-bold text-slate-800 dark:text-white">Preferencias</h3>
          <div className="bg-white dark:bg-surface-dark rounded-xl border border-slate-100 dark:border-slate-800 divide-y divide-slate-100 dark:divide-slate-800 shadow-sm overflow-hidden">
            <button className="w-full p-4 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
              <div className="flex items-center gap-3">
                <span className="material-icons-round text-primary">language</span>
                <span className="font-medium text-slate-800 dark:text-white">Idioma</span>
              </div>
              <div className="flex items-center gap-1 text-slate-500">
                <span className="text-sm">Español</span>
                <span className="material-icons-round text-xl">chevron_right</span>
              </div>
            </button>
            {/* Currency Option Hidden */}
          </div>
        </section>

        <section className="space-y-4">
          <h3 className="text-lg font-bold text-slate-800 dark:text-white">Notificaciones</h3>
          <div className="bg-white dark:bg-surface-dark rounded-xl border border-slate-100 dark:border-slate-800 divide-y divide-slate-100 dark:divide-slate-800 shadow-sm overflow-hidden">
            {[
              { title: 'Correo electrónico', desc: 'Recibe actualizaciones por email', defaultChecked: true },
              { title: 'Notificaciones push', desc: 'Alertas importantes en tu dispositivo', defaultChecked: true },
              { title: 'Promociones y ofertas', desc: 'Recibe descuentos especiales', defaultChecked: false }
            ].map((item, i) => (
              <div key={i} className="p-4 flex items-center justify-between">
                <div>
                  <p className="font-medium text-slate-800 dark:text-white">{item.title}</p>
                  <p className="text-xs text-slate-400">{item.desc}</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input type="checkbox" defaultChecked={item.defaultChecked} className="sr-only peer" />
                  <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none dark:bg-slate-700 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                </label>
              </div>
            ))}
          </div>
        </section>

        <section className="space-y-2 pt-4">
          <button 
            onClick={() => navigate('/user/login')}
            className="w-full flex items-center gap-3 p-4 text-red-500 font-medium bg-red-50 dark:bg-red-900/10 rounded-xl"
          >
            <span className="material-icons-round">logout</span>
            Cerrar sesión
          </button>
          <button className="w-full flex items-center gap-3 p-4 text-slate-500 dark:text-slate-400 font-medium">
            <span className="material-icons-round">delete_outline</span>
            Eliminar cuenta
          </button>
        </section>
      </div>
    </Layout>
  );
};

export default Profile;
