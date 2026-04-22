import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useUser } from '../context/UserContext';

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRole?: 'user' | 'provider' | 'admin';
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children, allowedRole }) => {
  const { user } = useUser();
  const location = useLocation();

  if (!user || !user.isAuthenticated) {
    // Allow access to login pages if not authenticated
    if (location.pathname.endsWith('/login')) {
      return <>{children}</>;
    }
    // Redirect to the appropriate login page based on the attempted URL
    let loginPath = '/user/login';
    if (location.pathname.startsWith('/provider')) loginPath = '/provider/login';
    if (location.pathname.startsWith('/admin')) loginPath = '/admin/login';
    return <Navigate to={loginPath} replace />;
  }

  // If user is authenticated and tries to access a login page, redirect to their home
  if (location.pathname.endsWith('/login')) {
    let homePath = '/user/home';
    if (user.role === 'provider') homePath = '/provider/dashboard';
    if (user.role === 'admin') homePath = '/admin/dashboard';
    return <Navigate to={homePath} replace />;
  }

  if (allowedRole && user.role !== allowedRole) {
    // Redirect to their respective home page if they try to access the wrong role's pages
    let homePath = '/user/home';
    if (user.role === 'provider') homePath = '/provider/dashboard';
    if (user.role === 'admin') homePath = '/admin/dashboard';
    return <Navigate to={homePath} replace />;
  }

  return <>{children}</>;
};

export default ProtectedRoute;
