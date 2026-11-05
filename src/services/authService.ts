import { supabase } from '../../lib/supabaseClient';

export const getPasswordRecoveryRedirect = (): string => {
  if (typeof window !== 'undefined' && window.location?.origin) {
    return `${window.location.origin}/auth-callback.html`;
  }
  return 'https://www.lugare.mx/auth-callback.html';
};

export const sendPasswordRecoveryEmail = (email: string) =>
  supabase.auth.resetPasswordForEmail(email, {
    redirectTo: getPasswordRecoveryRedirect(),
  });
