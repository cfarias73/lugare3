
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useUser } from '../../context/UserContext';
import { ErrorMessage } from '../../components/ui/ErrorMessage';
import Logo from '../../components/Logo';

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
          navigate('/provider/dashboard');
        }
      } else {
        const { error } = await signUp(email, password, name, 'provider');
        if (error) {
          setErrors({ email: 'Error al registrarse: ' + error.message });
        } else {
          navigate('/provider/dashboard');
        }
      }
    }
  };

  return (
    <div className="bg-background-light dark:bg-background-dark min-h-screen flex flex-col items-center justify-center p-4 max-w-md mx-auto">
      <button
        onClick={() => navigate('/')}
        className="fixed top-4 left-4 z-50 flex items-center gap-1 px-4 py-2 rounded-full bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 text-sm font-bold hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors shadow-md"
        aria-label="Volver al inicio"
      >
        <span className="material-icons-round text-lg">arrow_back</span>
        Inicio
      </button>
      <div className="w-full bg-white dark:bg-surface-dark rounded-[40px] shadow-2xl overflow-hidden px-8 py-10 flex flex-col relative transition-all duration-300">
        <div className="flex flex-col items-center mb-8">
          <div className="mb-4">
            <Logo size={80} showText={false} />
          </div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white text-center mb-1 font-display tracking-tight uppercase">
            {isLogin ? 'Bienvenido Anfitrión' : 'Crea tu cuenta'}
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 text-center px-4 leading-relaxed font-medium">
            {isLogin ? 'Promociona tu espacio entre miles de clientes' : 'Únete a nuestra red de anfitriones exclusivos'}
          </p>
        </div>

        <div className="flex border-b border-slate-100 dark:border-slate-800 mb-8 relative">
          <button 
            onClick={() => setIsLogin(true)}
            className={`flex-1 pb-4 text-center text-sm font-bold transition-colors uppercase ${isLogin ? 'text-primary' : 'text-slate-400'}`}
          >
            Iniciar Sesión
          </button>
          <button 
            onClick={() => setIsLogin(false)}
            className={`flex-1 pb-4 text-center text-sm font-bold transition-colors uppercase ${!isLogin ? 'text-primary' : 'text-slate-400'}`}
          >
            Registrarse
          </button>
          <div 
            className={`absolute bottom-0 h-1 bg-primary rounded-t-full transition-all duration-300 w-1/2 ${isLogin ? 'left-0' : 'left-1/2'}`}
          ></div>
        </div>

        <form className="space-y-5" onSubmit={handleSubmit}>
          {!isLogin && (
            <div className="space-y-1.5 animate-in fade-in slide-in-from-left-2 duration-300">
              <label className="text-[10px] font-bold text-slate-800 dark:text-slate-200 uppercase tracking-widest ml-1">Nombre completo</label>
              <input 
                className="w-full px-6 py-4 bg-slate-50 dark:bg-slate-800 border-none rounded-full text-slate-900 dark:text-white placeholder:text-slate-400 focus:ring-2 focus:ring-primary transition-all outline-none text-sm font-medium" 
                placeholder="Ej. Juan Pérez" 
                type="text" 
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
              <ErrorMessage message={errors.name} />
            </div>
          )}

          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-slate-800 dark:text-slate-200 uppercase tracking-widest ml-1">Correo electrónico</label>
            <input 
              className="w-full px-6 py-4 bg-slate-50 dark:bg-slate-800 border-none rounded-full text-slate-900 dark:text-white placeholder:text-slate-400 focus:ring-2 focus:ring-primary transition-all outline-none text-sm font-medium" 
              placeholder="tucorreo@ejemplo.com" 
              type="email" 
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
            <ErrorMessage message={errors.email} />
          </div>

          <div className="space-y-1.5">
            <div className="flex justify-between items-center px-1">
              <label className="text-[10px] font-bold text-slate-800 dark:text-slate-200 uppercase tracking-widest ml-1">Contraseña</label>
              {isLogin && (
                <button 
                  type="button"
                  onClick={() => navigate('/provider/forgot-password')}
                  className="text-[10px] font-bold text-secondary hover:underline uppercase tracking-tight"
                >
                  ¿Olvidaste tu contraseña?
                </button>
              )}
            </div>
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
            <ErrorMessage message={errors.password} />
          </div>

          {!isLogin && (
            <div className="space-y-1.5 animate-in fade-in slide-in-from-right-2 duration-300">
              <label className="text-[10px] font-bold text-slate-800 dark:text-slate-200 uppercase tracking-widest ml-1">Repetir contraseña</label>
              <div className="relative">
                <input 
                  className="w-full px-6 py-4 bg-slate-50 dark:bg-slate-800 border-none rounded-full text-slate-900 dark:text-white placeholder:text-slate-400 focus:ring-2 focus:ring-primary transition-all outline-none text-sm font-medium" 
                  type={showConfirmPassword ? 'text' : 'password'} 
                  placeholder="••••••••"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                />
                <button 
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-6 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                >
                  <span className="material-icons-outlined text-lg">{showConfirmPassword ? 'visibility_off' : 'visibility'}</span>
                </button>
              </div>
              <ErrorMessage message={errors.confirmPassword} />
            </div>
          )}

          <button className="w-full bg-primary hover:bg-orange-600 text-white font-bold py-5 rounded-full transition-all shadow-xl shadow-primary/20 active:scale-95 mt-4 uppercase tracking-widest text-sm" type="submit">
            {isLogin ? 'Iniciar Sesión' : 'Crear Cuenta'}
          </button>
        </form>

        <footer className="mt-12 text-center">
          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">
            © 2026 Lugare. Todos los derechos reservados.
          </p>
        </footer>
      </div>
    </div>
  );
};

export default Login;
