import { supabase } from '../../lib/supabaseClient';

const PASSWORD_RECOVERY_REDIRECT = 'https://www.lugare.mx/';

export const sendPasswordRecoveryEmail = (email: string) =>
  supabase.auth.resetPasswordForEmail(email, {
    redirectTo: PASSWORD_RECOVERY_REDIRECT,
  });
