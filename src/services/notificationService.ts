import { supabase } from '../../lib/supabaseClient';

export interface Notification {
  id: string;
  user_id: string;
  title: string | null;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
  link: string | null;
  read: boolean;
  created_at: string;
}

export const listNotifications = async (userId: string): Promise<Notification[]> => {
  const { data, error } = await supabase
    .from('notifications')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(100);
  if (error) {
    console.error('listNotifications error', error);
    return [];
  }
  return data || [];
};

export const markNotificationAsRead = async (id: string) => {
  const { error } = await supabase.from('notifications').update({ read: true }).eq('id', id);
  if (error) throw error;
};

export const markAllNotificationsAsRead = async (userId: string) => {
  const { error } = await supabase
    .from('notifications')
    .update({ read: true })
    .eq('user_id', userId)
    .eq('read', false);
  if (error) throw error;
};

export const deleteNotification = async (id: string) => {
  const { error } = await supabase.from('notifications').delete().eq('id', id);
  if (error) throw error;
};

export const createNotification = async (params: {
  userId: string;
  title: string;
  message: string;
  type?: 'info' | 'success' | 'warning' | 'error';
  link?: string | null;
}) => {
  const { error } = await supabase.from('notifications').insert({
    user_id: params.userId,
    title: params.title,
    message: params.message,
    type: params.type ?? 'info',
    link: params.link ?? null,
    read: false,
  });
  if (error) console.error('createNotification error', error);
};
