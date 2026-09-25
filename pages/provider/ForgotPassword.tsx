
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
    <div className="bg-background-light dark:bg-background-dark min-h-screen flex flex-col items-center justify-center p-4 max-w-md mx-auto transition-colors">
      <div className="w-full bg-white dark:bg-surface-dark rounded-[40px] shadow-2xl overflow-hidden px-8 py-10 flex flex-col relative animate-in fade-in zoom-in duration-300">
        <button 
          onClick={() => navigate(-1)}
          className="absolute top-8 left-6 p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors active:scale-90"
        >
          <span className="material-icons-outlined text-slate-700 dark:text-slate-300">arrow_back</span>
        </button>

        <div className="flex flex-col items-center mt-12 mb-8">
          <div className="w-20 h-20 bg-primary/10 rounded-[28px] flex items-center justify-center mb-6 text-primary shadow-inner">
            <span className="material-icons-round text-primary text-4xl">lock_reset</span>
          </div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white text-center mb-2 font-display tracking-tight">
            {emailSent ? '¡Correo enviado!' : 'Recuperar contraseña'}
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 text-center px-4 leading-relaxed font-medium">
            {emailSent 
              ? 'Hemos enviado las instrucciones a tu correo para que puedas restablecer tu acceso.' 
              : 'Ingresa tu correo electrónico y te enviaremos un enlace para restablecer tu cuenta.'}
          </p>
        </div>

        {!emailSent ? (
          <form className="space-y-6" onSubmit={handleSubmit}>
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-slate-800 dark:text-slate-200 uppercase tracking-widest ml-1">Correo electrónico</label>
              <div className="relative">
                <input 
                  className="w-full pl-12 pr-6 py-4 bg-slate-50 dark:bg-slate-800 border-none rounded-full text-slate-900 dark:text-white placeholder:text-slate-400 focus:ring-2 focus:ring-primary transition-all outline-none text-sm font-medium" 
                   placeholder="tucorreo@ejemplo.com"
                   type="email"
                   value={email}
                   onChange={(event) => setEmail(event.target.value)}
                   required
                />
                <span className="material-icons-outlined absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">mail</span>
              </div>
            </div>

            <button 
              disabled={isSubmitting}
              className="w-full bg-primary hover:bg-orange-600 text-white font-bold py-5 rounded-full transition-all shadow-xl shadow-primary/20 active:scale-95 uppercase tracking-widest text-sm disabled:opacity-60"
              type="submit"
            >
              {isSubmitting ? 'Enviando…' : 'Enviar enlace'}
            </button>
            {error && <p role="alert" className="text-center text-sm text-red-500">{error}</p>}
          </form>
        ) : (
          <div className="space-y-6">
            <button 
              onClick={() => navigate('/provider/login')}
              className="w-full bg-primary hover:bg-orange-600 text-white font-bold py-5 rounded-full transition-all shadow-xl shadow-primary/20 active:scale-95 uppercase tracking-widest text-sm"
            >
              Volver al inicio
            </button>
            <p className="text-center text-xs text-slate-400 font-medium">
              ¿No recibiste el correo? <button onClick={() => setEmailSent(false)} className="text-secondary font-bold hover:underline">Intentar de nuevo</button>
            </p>
          </div>
        )}

        <footer className="mt-12 text-center">
          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">
            © 2026 Lugare. Todos los derechos reservados.
          </p>
        </footer>
      </div>
    </div>
  );
};

export default ForgotPassword;
