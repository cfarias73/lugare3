import { useEffect } from 'react';
import { supabase } from '../../lib/supabaseClient';
import type { MessageRow } from '../services/messageService';

/**
 * Suscribe en realtime a INSERTs en `messages` y dispara callback con el nuevo mensaje.
 * Si se provee `conversationIds`, filtra en cliente para esa lista.
 */
export const useMessagesRealtime = (
  enabled: boolean,
  onMessage: (msg: MessageRow) => void,
  conversationIds?: string[]
) => {
  useEffect(() => {
    if (!enabled) return;
    const channel = supabase
      .channel(`messages-rt-${Math.random().toString(36).slice(2)}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'messages' },
        (payload) => {
          const msg = payload.new as MessageRow;
          if (conversationIds && conversationIds.length > 0 && !conversationIds.includes(msg.conversation_id)) {
            return;
          }
          onMessage(msg);
        }
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled, conversationIds?.join('|')]);
};
