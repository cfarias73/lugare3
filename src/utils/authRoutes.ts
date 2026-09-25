import type { User } from '../../types';

export const getRoleHomePath = (role: User['role']) => {
  if (role === 'provider') return '/provider/dashboard';
  if (role === 'admin') return '/admin/dashboard';
  return '/user/home';
};

export const getRoleLoginPath = (role: User['role']) => {
  if (role === 'provider') return '/provider/login';
  if (role === 'admin') return '/admin/login';
  return '/user/login';
};
