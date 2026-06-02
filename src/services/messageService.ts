import { supabase } from '../../lib/supabaseClient';
import { createNotification } from './notificationService';


export interface ConversationRow {
  id: string;
  user_id: string;
  provider_id: string;
  venue_id: string;
  last_message: string | null;
  last_message_at: string | null;
  created_at: string;
  venue_name?: string;
  venue_image?: string;
  user_name?: string;
  provider_name?: string;
}

export interface MessageRow {
  id: string;
  conversation_id: string;
  sender_id: string;
  content: string;
  read_at: string | null;
  created_at: string;
}

const FALLBACK_IMAGE = 'https://images.unsplash.com/photo-1519167758481-83f5e181dcc3?auto=format&fit=crop&q=80&w=400';

const hydrateConversations = async (rows: any[]): Promise<ConversationRow[]> => {
  if (rows.length === 0) return [];
  const venueIds = Array.from(new Set(rows.map((r) => r.venue_id)));
  const userIds = Array.from(new Set(rows.flatMap((r) => [r.user_id, r.provider_id])));

  const [venuesRes, profilesRes] = await Promise.all([
    supabase.from('venues').select('id, name, venue_images(image_url)').in('id', venueIds),
    supabase.from('profiles').select('id, name').in('id', userIds),
  ]);

  const venueMap = new Map<string, { name: string; image: string }>();
  (venuesRes.data || []).forEach((v: any) => {
    venueMap.set(v.id, {
      name: v.name,
      image: v.venue_images?.[0]?.image_url || FALLBACK_IMAGE,
    });
  });

  const profileMap = new Map<string, string>();
  (profilesRes.data || []).forEach((p: any) => {
    profileMap.set(p.id, p.name || 'Usuario');
  });

  return rows.map((r) => ({
    ...r,
    venue_name: venueMap.get(r.venue_id)?.name || 'Espacio',
    venue_image: venueMap.get(r.venue_id)?.image || FALLBACK_IMAGE,
    user_name: profileMap.get(r.user_id) || 'Usuario',
    provider_name: profileMap.get(r.provider_id) || 'Anfitrión',
  }));
};

export const listConversations = async (userId: string): Promise<ConversationRow[]> => {
  const { data, error } = await supabase
    .from('conversations')
    .select('*')
    .or(`user_id.eq.${userId},provider_id.eq.${userId}`)
    .order('last_message_at', { ascending: false, nullsFirst: false });
  if (error) {
    console.error('listConversations error', error);
    return [];
  }
  return hydrateConversations(data || []);
};

export const getOrCreateConversation = async (
  userId: string,
  venueId: string
): Promise<ConversationRow | null> => {
  const existing = await supabase
    .from('conversations')
    .select('*')
    .eq('user_id', userId)
    .eq('venue_id', venueId)
    .maybeSingle();
  if (existing.data) {
    const [hydrated] = await hydrateConversations([existing.data]);
    return hydrated;
  }

  const { data: venue, error: vErr } = await supabase
    .from('venues')
    .select('owner_id')
    .eq('id', venueId)
    .maybeSingle();
  if (vErr || !venue?.owner_id) {
    console.error('Venue has no owner; cannot start conversation', vErr);
    return null;
  }

  const { data, error } = await supabase
    .from('conversations')
    .insert({ user_id: userId, venue_id: venueId, provider_id: venue.owner_id })
    .select('*')
    .single();
  if (error) {
    console.error('Create conversation error', error);
    return null;
  }
  const [hydrated] = await hydrateConversations([data]);
  return hydrated;
};

export const getMessages = async (conversationId: string): Promise<MessageRow[]> => {
  const { data, error } = await supabase
    .from('messages')
    .select('*')
    .eq('conversation_id', conversationId)
    .order('created_at', { ascending: true });
  if (error) {
    console.error('getMessages error', error);
    return [];
  }
  return data || [];
};

export const sendMessage = async (
  conversationId: string,
  senderId: string,
  content: string
): Promise<{ data: MessageRow | null; error: string | null }> => {
  const { data, error } = await supabase
    .from('messages')
    .insert({ conversation_id: conversationId, sender_id: senderId, content })
    .select('*')
    .single();
  if (error) {
    console.error('sendMessage error', error);
    return { data: null, error: error.message };
  }
  await supabase
    .from('conversations')
    .update({ last_message: content, last_message_at: new Date().toISOString() })
    .eq('id', conversationId);

  // Notificar al otro participante
  try {
    const { data: conv } = await supabase
      .from('conversations')
      .select('user_id, provider_id, venue_id')
      .eq('id', conversationId)
      .maybeSingle();
    if (conv) {
      const recipientId = conv.user_id === senderId ? conv.provider_id : conv.user_id;
      const isProvider = recipientId === conv.provider_id;
      await createNotification({
        userId: recipientId,
        title: 'Nuevo mensaje',
        message: content.length > 80 ? content.slice(0, 80) + '…' : content,
        type: 'info',
        link: isProvider ? '/provider/messages' : '/user/messages',
      });
    }
  } catch (e) {
    console.error('notify message failed', e);
  }

  return { data, error: null };
};

