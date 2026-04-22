
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useUser } from '../../context/UserContext';
import { ErrorMessage } from '../../components/ui/ErrorMessage';

const Login: React.FC = () => {
  const navigate = useNavigate();
  const { signIn, signUp } = useUser();
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [name, setName] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validate = () => {
    const newErrors: Record<string, string> = {};
    if (!email.includes('@')) newErrors.email = 'Correo inválido';
    if (!isLogin && !name) newErrors.name = 'Nombre requerido';
    if (password.length < 6) newErrors.password = 'Mínimo 6 caracteres';
    if (!isLogin && password !== confirmPassword) newErrors.confirmPassword = 'Las contraseñas no coinciden';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (validate()) {
      if (isLogin) {
        const { error } = await signIn(email, password);
        if (error) {
          setErrors({ email: 'Error al iniciar sesión: ' + error.message });
        } else {
          navigate('/user/home');
        }
      } else {
        const { error } = await signUp(email, password, name, 'user');
        if (error) {
          setErrors({ email: 'Error al registrarse: ' + error.message });
        } else {
          navigate('/user/home');
        }
      }
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-white dark:bg-background-dark transition-colors duration-200">
      <div className="w-full max-w-[400px] flex flex-col items-center space-y-8">
        <div className="flex flex-col items-center space-y-4">
          <div className="relative w-24 h-24">
            <div className="w-full h-full flex items-center justify-center relative">
              <svg className="w-20 h-20 text-primary fill-current" viewBox="0 0 24 24">
                <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"></path>
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="material-icons-outlined text-white text-3xl">star</span>
              </div>
              <div className="absolute -top-1 -right-2 w-2 h-2 rounded-full bg-blue-400"></div>
              <div className="absolute top-4 -left-3 w-3 h-3 rounded-full bg-orange-300"></div>
              <div className="absolute bottom-6 -right-4 w-2 h-4 rounded-full bg-teal-400 rotate-45"></div>
            </div>
          </div>
          <div className="text-center space-y-2">
            <h1 className="text-2xl font-bold text-slate-800 dark:text-white font-display">
              {isLogin ? 'Bienvenido a Lugare' : 'Únete a Lugare'}
            </h1>
            <p className="text-sm text-slate-500 dark:text-slate-400 px-4 font-medium">
              {isLogin ? 'Encuentra el espacio perfecto para tu próximo evento' : 'Crea tu cuenta y comienza a explorar los mejores lugares'}
            </p>
          </div>
        </div>

        <div className="w-full border-b border-slate-100 dark:border-slate-800 flex relative">
          <button 
            onClick={() => setIsLogin(true)}
            className={`flex-1 py-3 text-sm font-bold transition-all ${isLogin ? 'text-primary' : 'text-slate-400'}`}
          >
            Iniciar Sesión
          </button>
          <button 
            onClick={() => setIsLogin(false)}
            className={`flex-1 py-3 text-sm font-bold transition-all ${!isLogin ? 'text-primary' : 'text-slate-400'}`}
          >
            Registrarse
          </button>
          <div 
            className={`absolute bottom-0 h-0.5 bg-primary transition-all duration-300 w-1/2 ${isLogin ? 'left-0' : 'left-1/2'}`}
          ></div>
        </div>

        <form className="w-full space-y-5" onSubmit={handleSubmit}>
          {!isLogin && (
            <div className="space-y-1.5 animate-in fade-in slide-in-from-left-2 duration-300">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-200 uppercase tracking-widest ml-1">Nombre completo</label>
              <input 
                className="w-full px-5 py-4 bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 rounded-full focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all placeholder:text-[#ADAEBC] dark:text-white text-sm font-medium" 
                placeholder="Ej. María Fernández" 
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
              <ErrorMessage message={errors.name} />
            </div>
          )}

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700 dark:text-slate-200 uppercase tracking-widest ml-1">Correo electrónico</label>
            <input 
              className="w-full px-5 py-4 bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 rounded-full focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all placeholder:text-[#ADAEBC] dark:text-white text-sm font-medium" 
              placeholder="tucorreo@ejemplo.com" 
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
            <ErrorMessage message={errors.email} />
          </div>

          <div className="space-y-1.5">
            <div className="flex justify-between items-center px-1">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-200 uppercase tracking-widest ml-1">Contraseña</label>
              {isLogin && (
                <button 
                  type="button"
                  onClick={() => navigate('/user/forgot-password')}
                  className="text-[10px] font-bold text-secondary hover:underline uppercase tracking-tight"
                >
                  ¿Olvidaste tu contraseña?
                </button>
              )}
            </div>
            <div className="relative">
              <input 
                className="w-full px-5 py-4 bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 rounded-full focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all dark:text-white text-sm font-medium" 
                type={showPassword ? 'text' : 'password'} 
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
              <button 
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-slate-600 transition-colors" 
              >
                <span className="material-icons-outlined text-lg">{showPassword ? 'visibility_off' : 'visibility'}</span>
              </button>
            </div>
            <ErrorMessage message={errors.password} />
          </div>

          {!isLogin && (
            <div className="space-y-1.5 animate-in fade-in slide-in-from-right-2 duration-300">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-200 uppercase tracking-widest ml-1">Repetir contraseña</label>
              <div className="relative">
                <input 
                  className="w-full px-5 py-4 bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 rounded-full focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all dark:text-white text-sm font-medium" 
                  type={showConfirmPassword ? 'text' : 'password'} 
                  placeholder="••••••••"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                />
                <button 
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-slate-600 transition-colors"
                >
                  <span className="material-icons-outlined text-lg">{showConfirmPassword ? 'visibility_off' : 'visibility'}</span>
                </button>
              </div>
              <ErrorMessage message={errors.confirmPassword} />
            </div>
          )}

          <button className="w-full bg-primary hover:bg-orange-600 text-white font-bold py-5 rounded-full shadow-lg shadow-primary/20 transition-all active:scale-[0.98] text-sm uppercase tracking-widest" type="submit">
            {isLogin ? 'Iniciar Sesión' : 'Registrarse'}
          </button>
        </form>

        <footer className="pt-8 text-center">
          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">
            © 2026 Lugare. Todos los derechos reservados.
          </p>
        </footer>
      </div>
      
      <button 
        className="fixed bottom-4 right-4 p-2.5 bg-gray-100 dark:bg-gray-800 rounded-full shadow-lg z-50 transition-colors border border-slate-200 dark:border-slate-700" 
        onClick={() => document.documentElement.classList.toggle('dark')}
      >
        <span className="material-icons-outlined text-gray-800 dark:text-gray-100">dark_mode</span>
      </button>
    </div>
  );
};

export default Login;
