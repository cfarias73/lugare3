import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useUser } from '../../context/UserContext';
import { supabase } from '../../lib/supabaseClient';
import { ErrorMessage } from '../../components/ui/ErrorMessage';
import { toast } from 'sonner';
import Logo from '../../components/Logo';

const AdminLogin: React.FC = () => {
  const navigate = useNavigate();
  const { signIn } = useUser();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    if (!email || !password) {
      setErrors({
        email: !email ? 'Requerido' : '',
        password: !password ? 'Requerido' : '',
      });
      return;
    }

    setIsLoading(true);
    try {
      const { error } = await signIn(email, password);
      if (error) {
        toast.error('Credenciales inválidas');
        setIsLoading(false);
        return;
      }

      const { data: { user: authUser } } = await supabase.auth.getUser();
      if (!authUser) {
        toast.error('No se pudo verificar la sesión');
        setIsLoading(false);
        return;
      }

      const { data: adminRow } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', authUser.id)
        .eq('role', 'admin')
        .maybeSingle();

      if (!adminRow) {
        await supabase.auth.signOut();
        toast.error('Esta cuenta no tiene permisos de administrador');
        setIsLoading(false);
        return;
      }

      toast.success('Bienvenido, Admin');
      navigate('/admin/dashboard', { replace: true });
    } catch (err) {
      console.error(err);
      toast.error('Error al iniciar sesión');
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-background-dark flex flex-col items-center justify-center p-6">
      <div className="w-full max-w-md bg-white dark:bg-surface-dark rounded-[40px] shadow-2xl p-10">
        <div className="flex justify-center mb-6">
          <Logo size={64} showText={false} />
        </div>
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
              disabled={isLoading}
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
                disabled={isLoading}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-6 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
              >
                <span className="material-icons-outlined text-lg">{showPassword ? 'visibility_off' : 'visibility'}</span>
              </button>
            </div>
            <ErrorMessage message={errors.password} />
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-primary hover:bg-orange-600 disabled:bg-slate-400 text-white font-bold py-5 rounded-full transition-all shadow-xl shadow-primary/20 active:scale-95 mt-4 uppercase tracking-widest text-sm"
          >
            {isLoading ? 'Verificando...' : 'Iniciar Sesión Admin'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default AdminLogin;
