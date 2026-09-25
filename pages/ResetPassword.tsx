import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';
import { PASSWORD_RECOVERY_MARKER } from '../components/AuthRecoveryHandler';

const ResetPassword: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [isCheckingLink, setIsCheckingLink] = useState(true);
  const [isRecoveryLinkValid, setIsRecoveryLinkValid] = useState(false);
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    let isMounted = true;

    const checkRecoverySession = async () => {
      let hasRecoveryMarker = location.state?.passwordRecovery === true;
      try {
        hasRecoveryMarker = hasRecoveryMarker || sessionStorage.getItem(PASSWORD_RECOVERY_MARKER) === 'true';
      } catch {
        // Fall through to the invalid-link state when storage cannot be checked.
      }

      const { data: { session } } = await supabase.auth.getSession();
      if (isMounted) {
        setIsRecoveryLinkValid(hasRecoveryMarker && Boolean(session));
        setIsCheckingLink(false);
      }
    };

    void checkRecoverySession();
    return () => { isMounted = false; };
  }, [location.state]);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError('');

    if (password.length < 8) {
      setError('La contraseña debe tener al menos 8 caracteres.');
      return;
    }
    if (password !== confirmPassword) {
      setError('Las contraseñas no coinciden.');
      return;
    }

    setIsSubmitting(true);
    const { error: updateError } = await supabase.auth.updateUser({ password });
    setIsSubmitting(false);

    if (updateError) {
      setError('No se pudo actualizar la contraseña. Solicita un nuevo enlace e inténtalo otra vez.');
      return;
    }

    try {
      sessionStorage.removeItem(PASSWORD_RECOVERY_MARKER);
    } catch {
      // Storage cleanup is best effort.
    }
    setSuccess(true);
  };

  const returnToLogin = async () => {
    let loginPath = '/user/login';
    const { data: { session } } = await supabase.auth.getSession();
    if (session?.user.user_metadata?.role === 'provider') {
      loginPath = '/provider/login';
    }

    await supabase.auth.signOut();
    navigate(loginPath, { replace: true });
  };

  return (
    <main className="min-h-screen flex flex-col items-center justify-center p-6 bg-white dark:bg-background-dark">
      <section className="w-full max-w-[400px] space-y-6 rounded-[32px] bg-white dark:bg-surface-dark p-8 shadow-xl">
        <div className="text-center space-y-2">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10 text-primary">
            <span className="material-icons-round text-3xl">lock_reset</span>
          </div>
          <h1 className="text-2xl font-bold text-slate-800 dark:text-white">
            {success ? 'Contraseña actualizada' : 'Crear nueva contraseña'}
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            {success
              ? 'Ya puedes iniciar sesión en Lugare con tu nueva contraseña.'
              : 'Elige una contraseña nueva para recuperar el acceso a tu cuenta.'}
          </p>
        </div>

        {isCheckingLink ? (
          <p className="text-center text-sm text-slate-500">Validando el enlace…</p>
        ) : success ? (
          <button
            type="button"
            onClick={() => void returnToLogin()}
            className="w-full rounded-full bg-primary py-4 text-sm font-bold uppercase tracking-widest text-white"
          >
            Ir a iniciar sesión
          </button>
        ) : isRecoveryLinkValid ? (
          <form className="space-y-4" onSubmit={handleSubmit}>
            <label className="block space-y-2">
              <span className="text-xs font-bold uppercase tracking-widest text-slate-700 dark:text-slate-200">Nueva contraseña</span>
              <input
                autoComplete="new-password"
                className="w-full rounded-full border border-slate-200 bg-slate-50 px-5 py-4 text-sm outline-none focus:border-primary dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                minLength={8}
                onChange={(event) => setPassword(event.target.value)}
                required
                type="password"
                value={password}
              />
            </label>
            <label className="block space-y-2">
              <span className="text-xs font-bold uppercase tracking-widest text-slate-700 dark:text-slate-200">Confirmar contraseña</span>
              <input
                autoComplete="new-password"
                className="w-full rounded-full border border-slate-200 bg-slate-50 px-5 py-4 text-sm outline-none focus:border-primary dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                minLength={8}
                onChange={(event) => setConfirmPassword(event.target.value)}
                required
                type="password"
                value={confirmPassword}
              />
            </label>
            {error && <p role="alert" className="text-sm text-red-500">{error}</p>}
            <button
              className="w-full rounded-full bg-primary py-4 text-sm font-bold uppercase tracking-widest text-white disabled:opacity-60"
              disabled={isSubmitting}
              type="submit"
            >
              {isSubmitting ? 'Actualizando…' : 'Guardar contraseña'}
            </button>
          </form>
        ) : (
          <div className="space-y-4 text-center">
            <p className="text-sm text-red-500">Este enlace ya venció o no es válido. Solicita uno nuevo desde la app.</p>
            <button
              type="button"
              onClick={() => navigate('/user/forgot-password', { replace: true })}
              className="w-full rounded-full bg-primary py-4 text-sm font-bold uppercase tracking-widest text-white"
            >
              Solicitar otro enlace
            </button>
            <button
              type="button"
              onClick={() => navigate('/provider/forgot-password', { replace: true })}
              className="w-full rounded-full border border-slate-200 py-4 text-sm font-bold uppercase tracking-widest text-slate-700 dark:border-slate-700 dark:text-slate-200"
            >
              Recuperación para anfitriones
            </button>
          </div>
        )}
      </section>
    </main>
  );
};

export default ResetPassword;
