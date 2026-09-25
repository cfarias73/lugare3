import React, { useEffect, useState } from 'react';
import { Navigate, useLocation, useNavigate } from 'react-router-dom';
import { useUser } from '../context/UserContext';
import { supabase } from '../lib/supabaseClient';
import { getRoleHomePath, getRoleLoginPath } from '../src/utils/authRoutes';

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRole?: 'user' | 'provider' | 'admin';
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children, allowedRole }) => {
  const { user, logout } = useUser();
  const location = useLocation();
  const navigate = useNavigate();
  const [sessionChecked, setSessionChecked] = useState(false);
  const [hasSession, setHasSession] = useState(false);

  // Check if a Supabase session exists (independent of UserContext hydration).
  // This avoids race conditions where context hasn't loaded `user` yet but
  // the user IS logged in.
  useEffect(() => {
    let mounted = true;
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!mounted) return;
      setHasSession(!!session);
      setSessionChecked(true);
    });
    return () => { mounted = false; };
  }, [location.pathname]);

  // Login pages are always accessible
  if (location.pathname.endsWith('/login')) {
    // If already authenticated and on a login page, redirect to home for the role
    if (user?.isAuthenticated) {
      let homePath = '/user/home';
      if (user.role === 'provider') homePath = '/provider/dashboard';
      if (user.role === 'admin') homePath = '/admin/dashboard';
      return <Navigate to={homePath} replace />;
    }
    return <>{children}</>;
  }

  // Still checking session — show nothing briefly to avoid flicker/redirect loop
  if (!sessionChecked) {
    return null;
  }

  // No Supabase session at all → go to the right login
  if (!hasSession) {
    let loginPath = '/user/login';
    if (location.pathname.startsWith('/provider')) loginPath = '/provider/login';
    if (location.pathname.startsWith('/admin')) loginPath = '/admin/login';
    return <Navigate to={loginPath} replace />;
  }

  // Session exists but UserContext hasn't hydrated yet → wait, don't bounce
  if (!user) {
    return null;
  }

  // A session for another role must not continue into this protected flow.
  if (allowedRole && user.role !== allowedRole) {
    const roleLabels = {
      user: 'cliente',
      provider: 'anfitrión',
      admin: 'administrador',
    };

    const switchAccount = async () => {
      await logout();
      navigate(getRoleLoginPath(allowedRole), { replace: true });
    };

    return (
      <div className="min-h-screen flex items-center justify-center bg-white dark:bg-background-dark p-6">
        <div className="w-full max-w-sm space-y-5 rounded-3xl bg-white dark:bg-surface-dark p-7 text-center shadow-xl">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 text-primary">
            <span className="material-icons-round text-3xl">switch_account</span>
          </div>
          <h1 className="text-xl font-bold text-slate-800 dark:text-white">Cambia de tipo de cuenta</h1>
          <p className="text-sm leading-relaxed text-slate-500 dark:text-slate-400">
            Tienes abierta una cuenta de {roleLabels[user.role]}. Para continuar aquí necesitas una cuenta de {roleLabels[allowedRole]}.
          </p>
          <button
            type="button"
            onClick={() => void switchAccount()}
            className="w-full rounded-full bg-primary py-4 text-sm font-bold uppercase tracking-widest text-white"
          >
            Cambiar de cuenta
          </button>
          <button
            type="button"
            onClick={() => navigate(getRoleHomePath(user.role), { replace: true })}
            className="w-full rounded-full border border-slate-200 py-4 text-sm font-bold text-slate-700 dark:border-slate-700 dark:text-slate-200"
          >
            Volver a mi cuenta de {roleLabels[user.role]}
          </button>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};

export default ProtectedRoute;
