import { useEffect } from 'react';
import { supabase } from '../../lib/supabaseClient';
import { toast } from 'sonner';
import { useUser } from '../../context/UserContext';

export const useRealtimeNotifications = () => {
  const { user } = useUser();

  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel('notifications')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${user.id}`,
        },
        (payload) => {
          const { message, type } = payload.new as any;
          if (type === 'success') toast.success(message);
          else if (type === 'error') toast.error(message);
          else toast(message);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);
};
