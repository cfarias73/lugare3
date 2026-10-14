import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import ProviderLayout from '../../components/ProviderLayout';
import { useUser } from '../../context/UserContext';
import { Skeleton } from '../../components/ui/Skeleton';
import { EmptyState } from '../../components/ui/EmptyState';
import {
  listConversations,
  getMessages,
  sendMessage,
  getOrCreateConversationByParticipants,
  ConversationRow,
  MessageRow,
} from '../../src/services/messageService';
import { useMessagesRealtime } from '../../src/hooks/useMessagesRealtime';

const formatTime = (iso: string | null) => {
  if (!iso) return '';
  return new Date(iso).toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' });
};

const formatDateSeparator = (iso: string | null) => {
  if (!iso) return '';
  const date = new Date(iso);
  const now = new Date();

  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const msgDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const diffTime = today.getTime() - msgDate.getTime();
  const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return 'Hoy';
  if (diffDays === 1) return 'Ayer';
  if (diffDays > 1 && diffDays < 7) {
    const weekday = date.toLocaleDateString('es-MX', { weekday: 'long' });
    return weekday.charAt(0).toUpperCase() + weekday.slice(1);
  }

  return date.toLocaleDateString('es-MX', {
    day: 'numeric',
    month: 'short',
    year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined,
  });
};

const Messages: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const openWith = (location.state as any) as { openUserId?: string; openVenueId?: string } | null;
  const { user } = useUser();
  const [conversations, setConversations] = useState<ConversationRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [activeId, setActiveId] = useState<string | null>(null);
  const [thread, setThread] = useState<MessageRow[]>([]);
  const [threadLoading, setThreadLoading] = useState(false);
  const [draft, setDraft] = useState('');
  const [sending, setSending] = useState(false);
  const scrollRef = useRef<HTMLDivElement | null>(null);

  const load = useCallback(async () => {
    if (!user) return [] as ConversationRow[];
    setLoading(true);
    const data = await listConversations(user.id);
    setConversations(data);
    setLoading(false);
    return data;
  }, [user]);

  useEffect(() => { load(); }, [load]);

  // Si llegamos desde "Reservas recibidas" con un huésped + espacio, abrir/crear esa conversación
  useEffect(() => {
    if (!user || !openWith?.openUserId || !openWith?.openVenueId) return;
    (async () => {
      const conv = await getOrCreateConversationByParticipants(
        openWith.openUserId!,
        user.id,
        openWith.openVenueId!
      );
      if (conv) {
        await load();
        setActiveId(conv.id);
        navigate(location.pathname, { replace: true });
      } else {
        toast.error('No se pudo abrir la conversación');
      }
    })();
  }, [user, openWith?.openUserId, openWith?.openVenueId, load, navigate, location.pathname]);

  const activeConversation = useMemo(
    () => conversations.find((c) => c.id === activeId) || null,
    [activeId, conversations]
  );

  useEffect(() => {
    if (!activeId) { setThread([]); return; }
    setThreadLoading(true);
    getMessages(activeId).then((m) => {
      setThread(m);
      setThreadLoading(false);
    });
  }, [activeId]);

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [thread]);

  // Realtime: incoming messages for any of the host's conversations
  const convIds = useMemo(() => conversations.map((c) => c.id), [conversations]);
  useMessagesRealtime(
    !!user && convIds.length > 0,
    (msg) => {
      if (msg.sender_id === user?.id) return; // ignore own (already optimistic)
      if (msg.conversation_id === activeId) {
        setThread((prev) => (prev.some((m) => m.id === msg.id) ? prev : [...prev, msg]));
      }
      setConversations((prev) =>
        prev.map((c) =>
          c.id === msg.conversation_id
            ? { ...c, last_message: msg.content, last_message_at: msg.created_at }
            : c
        )
      );
    },
    convIds
  );

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return conversations;
    return conversations.filter(
      (c) =>
        (c.venue_name || '').toLowerCase().includes(q) ||
        (c.user_name || '').toLowerCase().includes(q) ||
        (c.last_message || '').toLowerCase().includes(q)
    );
  }, [conversations, search]);

  const handleSend = async () => {
    const text = draft.trim();
    if (!text || !activeConversation || !user) return;
    setSending(true);
    const { data: msg, error } = await sendMessage(activeConversation.id, user.id, text);
    if (error) {
      toast.error(`No se pudo enviar: ${error}`);
    } else if (msg) {
      setThread((prev) => [...prev, msg]);
      setDraft('');
      setConversations((prev) =>
        prev.map((c) =>
          c.id === activeConversation.id
            ? { ...c, last_message: text, last_message_at: msg.created_at }
            : c
        )
      );
    }
    setSending(false);
  };

  // ============= CHAT VIEW =============
  if (activeConversation) {
    return (
    <ProviderLayout hideLogout>
      <header className="sticky top-0 z-30 bg-white dark:bg-card-dark border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-3 px-3 py-3">
            <button onClick={() => setActiveId(null)} className="p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800">
              <span className="material-icons-outlined text-slate-700 dark:text-white">arrow_back</span>
            </button>
            <img src={activeConversation.venue_image} alt={activeConversation.venue_name} className="w-10 h-10 rounded-full object-cover" />
            <div className="flex-1 min-w-0">
              <h2 className="font-semibold text-slate-800 dark:text-white truncate text-[15px] leading-tight">
                {activeConversation.user_name}
              </h2>
              <p className="text-[11.5px] text-[#12B2C1] font-medium truncate">{activeConversation.venue_name}</p>
            </div>
          </div>
        </header>

        <main ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-4 space-y-3 bg-slate-50 dark:bg-slate-900/40">
          {threadLoading ? (
            <Skeleton className="h-12 w-2/3 rounded-2xl" />
          ) : thread.length === 0 ? (
            <p className="text-center text-sm text-slate-400 pt-8">Sin mensajes todavía.</p>
          ) : (
            thread.map((b, idx) => {
              const mine = b.sender_id === user?.id;
              const prevMsg = idx > 0 ? thread[idx - 1] : null;
              const currentDateStr = b.created_at ? new Date(b.created_at).toDateString() : '';
              const prevDateStr = prevMsg?.created_at ? new Date(prevMsg.created_at).toDateString() : '';
              const showDateSeparator = idx === 0 || currentDateStr !== prevDateStr;

              return (
                <React.Fragment key={b.id}>
                  {showDateSeparator && (
                    <div className="flex justify-center my-3">
                      <span className="px-3 py-1 text-[11px] font-medium text-slate-500 dark:text-slate-400 bg-white/80 dark:bg-slate-800/80 rounded-full shadow-xs border border-slate-200/60 dark:border-slate-700/60 backdrop-blur-xs">
                        {formatDateSeparator(b.created_at)}
                      </span>
                    </div>
                  )}
                  <div className={`flex ${mine ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[78%] px-4 py-2.5 rounded-2xl shadow-sm text-[14px] leading-snug ${
                      mine ? 'bg-primary text-white rounded-br-md' : 'bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 rounded-bl-md border border-slate-100 dark:border-slate-700'
                    }`}>
                      <p className="whitespace-pre-wrap break-words">{b.content}</p>
                      <p className={`text-[10.5px] mt-1 text-right ${mine ? 'text-white/70' : 'text-slate-400'}`}>
                        {formatTime(b.created_at)}
                      </p>
                    </div>
                  </div>
                </React.Fragment>
              );
            })
          )}
        </main>

        <div className="sticky bottom-0 bg-white dark:bg-card-dark border-t border-slate-100 dark:border-slate-800 px-3 py-3">
          <div className="flex items-end gap-2">
            <div className="flex-1 bg-slate-100 dark:bg-slate-800 rounded-2xl px-4 py-2.5">
              <textarea
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); }
                }}
                rows={1}
                placeholder="Escribe un mensaje..."
                className="bg-transparent border-none outline-none resize-none w-full text-sm text-slate-800 dark:text-white placeholder:text-slate-400 max-h-32"
              />
            </div>
            <button
              onClick={handleSend}
              disabled={!draft.trim() || sending}
              className="w-11 h-11 flex-shrink-0 bg-primary text-white rounded-full flex items-center justify-center shadow-md disabled:opacity-40"
            >
              <span className="material-icons-round text-xl">send</span>
            </button>
          </div>
        </div>
      </ProviderLayout>
    );
  }

  // ============= LIST VIEW =============
  return (
    <ProviderLayout>
      <header className="bg-white dark:bg-card-dark px-4 py-3 flex items-center justify-between sticky top-0 z-30">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate(-1)} className="p-1">
            <span className="material-icons-outlined text-slate-800 dark:text-slate-200">arrow_back</span>
          </button>
          <h1 className="text-xl font-bold text-slate-800 dark:text-slate-100 font-display">Mensajes</h1>
        </div>
      </header>

      <main className="p-4 space-y-4">
        <div className="relative">
          <span className="material-icons-outlined absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">search</span>
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-white dark:bg-zinc-800 border-none rounded-xl py-3 pl-12 pr-4 text-sm placeholder:text-slate-400 focus:ring-2 focus:ring-primary/20 shadow-sm dark:text-white outline-none"
            placeholder="Buscar mensajes"
            type="text"
          />
        </div>

        {loading ? (
          <div className="space-y-3">
            <Skeleton className="h-20 rounded-2xl" />
            <Skeleton className="h-20 rounded-2xl" />
          </div>
        ) : filtered.length === 0 ? (
          <EmptyState
            icon="chat_bubble_outline"
            title={search ? 'Sin resultados' : 'Sin conversaciones'}
            description={search ? 'Prueba con otra búsqueda.' : 'Cuando un usuario te contacte aparecerá aquí.'}
          />
        ) : (
          <div className="space-y-3">
            {filtered.map((c) => (
              <button
                key={c.id}
                onClick={() => setActiveId(c.id)}
                className="w-full text-left bg-white dark:bg-card-dark p-4 rounded-2xl flex gap-3 shadow-sm hover:shadow-md border border-slate-50 dark:border-zinc-800/50"
              >
                <img alt={c.user_name} className="h-14 w-14 rounded-full object-cover flex-shrink-0" src={c.venue_image} />
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-start mb-0.5">
                    <h3 className="font-semibold text-slate-800 dark:text-white truncate">{c.user_name}</h3>
                    <span className="text-xs text-slate-400">{formatTime(c.last_message_at)}</span>
                  </div>
                  <p className="text-sm text-slate-500 dark:text-zinc-400 truncate leading-snug">
                    {c.last_message || 'Sin mensajes aún'}
                  </p>
                  <p className="text-[12px] text-[#12B2C1] font-medium truncate">{c.venue_name}</p>
                </div>
              </button>
            ))}
          </div>
        )}
      </main>
    </ProviderLayout>
  );
};

export default Messages;
