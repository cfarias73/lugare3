import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';

const RECOVERY_MARKER = 'lugare_password_recovery';

export const PASSWORD_RECOVERY_MARKER = RECOVERY_MARKER;

const AuthRecoveryHandler = () => {
  const navigate = useNavigate();

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'PASSWORD_RECOVERY') {
        try {
          sessionStorage.setItem(RECOVERY_MARKER, 'true');
        } catch {
          // Route state is also passed so the recovery screen can still open.
        }
        navigate('/reset-password', { replace: true, state: { passwordRecovery: true } });
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  return null;
};

export default AuthRecoveryHandler;
