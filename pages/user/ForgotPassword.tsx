
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { sendPasswordRecoveryEmail } from '../../src/services/authService';

const ForgotPassword: React.FC = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [emailSent, setEmailSent] = useState(false);
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.includes('@')) {
      setError('Por favor, ingresa un correo válido.');
      return;
    }
    setError('');
    setIsSubmitting(true);
    const { error: requestError } = await sendPasswordRecoveryEmail(email.trim());
    setIsSubmitting(false);
    if (requestError) {
      setError('No pudimos enviar el enlace. Inténtalo de nuevo en unos minutos.');
      return;
    }
    setEmailSent(true);
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-white dark:bg-background-dark transition-colors duration-200">
      <div className="w-full max-w-[400px] flex flex-col items-center space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
        <button 
          onClick={() => navigate(-1)}
          className="self-start p-2 -ml-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors"
        >
          <span className="material-icons-outlined text-slate-700 dark:text-slate-300">arrow_back</span>
        </button>

        <div className="flex flex-col items-center space-y-4">
          <div className="w-20 h-20 bg-primary rounded-3xl flex items-center justify-center shadow-2xl shadow-primary/30 transform -rotate-6">
            <span className="material-icons-round text-white text-4xl">key</span>
          </div>
          <div className="text-center space-y-2">
            <h1 className="text-2xl font-bold text-slate-800 dark:text-white font-display">
              {emailSent ? 'Revisa tu buzón' : '¿Olvidaste tu clave?'}
            </h1>
            <p className="text-sm text-slate-500 dark:text-slate-400 px-4 font-medium">
              {emailSent 
                ? 'Hemos enviado un enlace de recuperación a tu dirección de correo.' 
                : 'No te preocupes, sucede. Ingresa tu email para recuperar el acceso a tu cuenta.'}
            </p>
          </div>
        </div>

        {!emailSent ? (
          <form className="w-full space-y-6" onSubmit={handleSubmit}>
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-200 uppercase tracking-widest ml-1">Correo electrónico</label>
              <div className="relative">
                <input 
                  className="w-full pl-12 pr-5 py-4 bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 rounded-full focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all placeholder:text-[#ADAEBC] dark:text-white text-sm font-medium" 
                  placeholder="tucorreo@ejemplo.com" 
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
                <span className="material-icons-outlined absolute left-5 top-1/2 -translate-y-1/2 text-slate-400">mail_outline</span>
              </div>
              {error && <p className="text-red-500 text-xs mt-1 ml-4">{error}</p>}
            </div>

            <button disabled={isSubmitting} className="w-full bg-primary hover:bg-orange-600 text-white font-bold py-5 rounded-full shadow-lg shadow-primary/20 transition-all active:scale-[0.98] text-sm uppercase tracking-widest disabled:opacity-60" type="submit">
              {isSubmitting ? 'Enviando…' : 'Enviar Instrucciones'}
            </button>
          </form>
        ) : (
          <div className="w-full space-y-4">
            <button 
              onClick={() => navigate('/user/login')}
              className="w-full bg-primary hover:bg-orange-600 text-white font-bold py-5 rounded-full shadow-lg shadow-primary/20 transition-all active:scale-[0.98] text-sm uppercase tracking-widest"
            >
              Volver al Login
            </button>
            <p className="text-center text-xs text-slate-400 font-medium">
              ¿No recibiste nada? <button onClick={() => setEmailSent(false)} className="text-secondary font-bold">Reintentar</button>
            </p>
          </div>
        )}

        <footer className="pt-8 text-center">
          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">
            © 2026 Lugare. Todos los derechos reservados.
          </p>
        </footer>
      </div>
    </div>
  );
};

export default ForgotPassword;
