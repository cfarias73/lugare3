import { useEffect, useRef } from 'react';
import { supabase } from '../../lib/supabaseClient';
import type { MessageRow } from '../services/messageService';

/**
 * Suscribe en realtime a INSERTs en `messages` y dispara callback con el nuevo mensaje.
 * Utiliza refs para evitar problemas de stale closure (estado desactualizado de React).
 */
export const useMessagesRealtime = (
  enabled: boolean,
  onMessage: (msg: MessageRow) => void,
  conversationIds?: string[]
) => {
  const onMessageRef = useRef(onMessage);
  const conversationIdsRef = useRef(conversationIds);

  useEffect(() => {
    onMessageRef.current = onMessage;
  }, [onMessage]);

  useEffect(() => {
    conversationIdsRef.current = conversationIds;
  }, [conversationIds]);

  useEffect(() => {
    if (!enabled) return;

    const channelName = `messages-rt-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    const channel = supabase
      .channel(channelName)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'messages' },
        (payload) => {
          const msg = payload.new as MessageRow;
          if (!msg || !msg.id) return;
          onMessageRef.current?.(msg);
        }
      )
      .subscribe((status, err) => {
        if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
          console.warn(`[Realtime Messages] Status: ${status}`, err);
        }
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [enabled]);
};
