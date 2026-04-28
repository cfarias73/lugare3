import React, { useEffect, useState } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useUser } from '../context/UserContext';
import { supabase } from '../lib/supabaseClient';

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRole?: 'user' | 'provider' | 'admin';
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children, allowedRole }) => {
  const { user } = useUser();
  const location = useLocation();
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

  // Role mismatch → send to their own home
  if (allowedRole && user.role !== allowedRole) {
    let homePath = '/user/home';
    if (user.role === 'provider') homePath = '/provider/dashboard';
    if (user.role === 'admin') homePath = '/admin/dashboard';
    return <Navigate to={homePath} replace />;
  }

  return <>{children}</>;
};

export default ProtectedRoute;
