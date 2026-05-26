import { supabase } from '../../lib/supabaseClient';

export interface ConversationRow {
  id: string;
  user_id: string;
  provider_id: string;
  venue_id: string;
  last_message: string | null;
  last_message_at: string | null;
  created_at: string;
  venue?: { id: string; name: string; venue_images?: { image_url: string }[] };
  user_profile?: { id: string; name: string | null };
  provider_profile?: { id: string; name: string | null };
}

export interface MessageRow {
  id: string;
  conversation_id: string;
  sender_id: string;
  content: string;
  read_at: string | null;
  created_at: string;
}

const CONVERSATION_SELECT = `
  *,
  venue:venues!conversations_venue_id_fkey ( id, name, venue_images ( image_url ) ),
  user_profile:profiles!conversations_user_id_fkey ( id, name ),
  provider_profile:profiles!conversations_provider_id_fkey ( id, name )
`;

export const listConversations = async (userId: string): Promise<ConversationRow[]> => {
  const { data, error } = await supabase
    .from('conversations')
    .select(CONVERSATION_SELECT)
    .or(`user_id.eq.${userId},provider_id.eq.${userId}`)
    .order('last_message_at', { ascending: false, nullsFirst: false });
  if (error) {
    console.error('listConversations error', error);
    return [];
  }
  return (data || []) as any;
};

export const getOrCreateConversation = async (
  userId: string,
  venueId: string
): Promise<ConversationRow | null> => {
  // Try existing first
  const existing = await supabase
    .from('conversations')
    .select(CONVERSATION_SELECT)
    .eq('user_id', userId)
    .eq('venue_id', venueId)
    .maybeSingle();
  if (existing.data) return existing.data as any;

  // Need provider/owner of the venue
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
    .select(CONVERSATION_SELECT)
    .single();
  if (error) {
    console.error('Create conversation error', error);
    return null;
  }
  return data as any;
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
): Promise<MessageRow | null> => {
  const { data, error } = await supabase
    .from('messages')
    .insert({ conversation_id: conversationId, sender_id: senderId, content })
    .select('*')
    .single();
  if (error) {
    console.error('sendMessage error', error);
    return null;
  }
  // Update last_message on conversation (best-effort)
  await supabase
    .from('conversations')
    .update({ last_message: content, last_message_at: new Date().toISOString() })
    .eq('id', conversationId);
  return data;
};
