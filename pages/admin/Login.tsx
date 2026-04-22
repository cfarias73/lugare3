import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useUser } from '../../context/UserContext';
import { ErrorMessage } from '../../components/ui/ErrorMessage';

const AdminLogin: React.FC = () => {
  const navigate = useNavigate();
  const { login } = useUser();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Dummy login for testing purposes
    login(email, 'Super Admin', 'admin');
    navigate('/admin/dashboard');
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-background-dark flex flex-col items-center justify-center p-6">
      <div className="w-full max-w-md bg-white dark:bg-surface-dark rounded-[40px] shadow-2xl p-10">
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white text-center mb-8 font-display uppercase tracking-tight">
          Acceso SuperAdmin
        </h1>
        <form className="space-y-5" onSubmit={handleSubmit}>
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-slate-800 dark:text-slate-200 uppercase tracking-widest ml-1">Correo electrónico</label>
            <input 
              className="w-full px-6 py-4 bg-slate-50 dark:bg-slate-800 border-none rounded-full text-slate-900 dark:text-white placeholder:text-slate-400 focus:ring-2 focus:ring-primary transition-all outline-none text-sm font-medium" 
              placeholder="admin@lugare.com" 
              type="email" 
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
            <ErrorMessage message={errors.email} />
          </div>

          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-slate-800 dark:text-slate-200 uppercase tracking-widest ml-1">Contraseña</label>
            <div className="relative">
              <input 
                className="w-full px-6 py-4 bg-slate-50 dark:bg-slate-800 border-none rounded-full text-slate-900 dark:text-white placeholder:text-slate-400 focus:ring-2 focus:ring-primary transition-all outline-none text-sm font-medium" 
                type={showPassword ? 'text' : 'password'} 
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
              <button 
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-6 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                >
                <span className="material-icons-outlined text-lg">{showPassword ? 'visibility_off' : 'visibility'}</span>
              </button>
            </div>
          </div>

          <button className="w-full bg-primary hover:bg-orange-600 text-white font-bold py-5 rounded-full transition-all shadow-xl shadow-primary/20 active:scale-95 mt-4 uppercase tracking-widest text-sm" type="submit">
            Iniciar Sesión Admin
          </button>
        </form>
      </div>
    </div>
  );
};

export default AdminLogin;
