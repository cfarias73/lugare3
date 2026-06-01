import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import Layout from '../../components/Layout';
import { useUser } from '../../context/UserContext';
import { Skeleton } from '../../components/ui/Skeleton';
import { EmptyState } from '../../components/ui/EmptyState';
import {
  listConversations,
  getMessages,
  sendMessage,
  getOrCreateConversation,
  ConversationRow,
  MessageRow,
} from '../../src/services/messageService';

const formatTime = (iso: string | null) => {
  if (!iso) return '';
  const d = new Date(iso);
  return d.toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' });
};

const Messages: React.FC = () => {
  const { user } = useUser();
  const navigate = useNavigate();
  const location = useLocation();
  const openVenueId = (location.state as any)?.openVenueId as string | undefined;

  const [conversations, setConversations] = useState<ConversationRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [activeId, setActiveId] = useState<string | null>(null);
  const [thread, setThread] = useState<MessageRow[]>([]);
  const [threadLoading, setThreadLoading] = useState(false);
  const [draft, setDraft] = useState('');
  const [sending, setSending] = useState(false);
  const scrollRef = useRef<HTMLDivElement | null>(null);

  const loadConversations = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    const data = await listConversations(user.id);
    setConversations(data);
    setLoading(false);
    return data;
  }, [user]);

  useEffect(() => {
    loadConversations();
  }, [loadConversations]);

  // If we were sent here from VenueDetail with a venue to open
  useEffect(() => {
    if (!user || !openVenueId) return;
    (async () => {
      const conv = await getOrCreateConversation(user.id, openVenueId);
      if (conv) {
        await loadConversations();
        setActiveId(conv.id);
        // clear state so refresh doesn't re-open
        navigate(location.pathname, { replace: true });
      }
    })();
  }, [user, openVenueId, loadConversations, navigate, location.pathname]);

  const activeConversation = useMemo(
    () => conversations.find((c) => c.id === activeId) || null,
    [activeId, conversations]
  );

  useEffect(() => {
    if (!activeId) {
      setThread([]);
      return;
    }
    setThreadLoading(true);
    getMessages(activeId).then((m) => {
      setThread(m);
      setThreadLoading(false);
    });
  }, [activeId]);

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [thread]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return conversations;
    return conversations.filter(
      (c) =>
        (c.venue_name || '').toLowerCase().includes(q) ||
        (c.provider_name || '').toLowerCase().includes(q) ||
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
      <Layout>
        <header className="sticky top-0 z-30 bg-white dark:bg-background-dark border-b border-gray-100 dark:border-slate-800">
          <div className="flex items-center gap-3 px-3 py-3">
            <button
              onClick={() => setActiveId(null)}
              className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-slate-800"
              aria-label="Volver"
            >
              <span className="material-icons-outlined text-slate-700 dark:text-white">arrow_back</span>
            </button>
            <img
              src={activeConversation.venue_image}
              alt={activeConversation.venue_name}
              className="w-10 h-10 rounded-full object-cover"
            />
            <div className="flex-1 min-w-0">
              <h2 className="font-semibold text-slate-800 dark:text-white truncate text-[15px] leading-tight">
                {activeConversation.provider_name}
              </h2>
              <p className="text-[11.5px] text-[#12B2C1] font-medium truncate">
                {activeConversation.venue_name}
              </p>
            </div>
          </div>
        </header>

        <main
          ref={scrollRef}
          className="flex-1 overflow-y-auto px-4 py-4 space-y-3 bg-slate-50 dark:bg-slate-900/40"
        >
          {threadLoading ? (
            <div className="space-y-3">
              <Skeleton className="h-12 w-2/3 rounded-2xl" />
              <Skeleton className="h-12 w-1/2 rounded-2xl ml-auto" />
            </div>
          ) : thread.length === 0 ? (
            <p className="text-center text-sm text-slate-400 pt-8">
              Empieza la conversación con {activeConversation.provider_name}.
            </p>
          ) : (
            thread.map((b) => {
              const mine = b.sender_id === user?.id;
              return (
                <div key={b.id} className={`flex ${mine ? 'justify-end' : 'justify-start'}`}>
                  <div
                    className={`max-w-[78%] px-4 py-2.5 rounded-2xl shadow-sm text-[14px] leading-snug ${
                      mine
                        ? 'bg-primary text-white rounded-br-md'
                        : 'bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 rounded-bl-md border border-slate-100 dark:border-slate-700'
                    }`}
                  >
                    <p className="whitespace-pre-wrap break-words">{b.content}</p>
                    <p className={`text-[10.5px] mt-1 text-right ${mine ? 'text-white/70' : 'text-slate-400'}`}>
                      {formatTime(b.created_at)}
                    </p>
                  </div>
                </div>
              );
            })
          )}
        </main>

        <div className="sticky bottom-0 bg-white dark:bg-background-dark border-t border-gray-100 dark:border-slate-800 px-3 py-3">
          <div className="flex items-end gap-2">
            <div className="flex-1 bg-slate-100 dark:bg-slate-800 rounded-2xl px-4 py-2.5 focus-within:ring-2 focus-within:ring-primary/30">
              <textarea
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSend();
                  }
                }}
                rows={1}
                placeholder="Escribe un mensaje..."
                className="bg-transparent border-none outline-none resize-none w-full text-sm text-slate-800 dark:text-white placeholder:text-slate-400 max-h-32"
              />
            </div>
            <button
              onClick={handleSend}
              disabled={!draft.trim() || sending}
              className="w-11 h-11 flex-shrink-0 bg-primary text-white rounded-full flex items-center justify-center shadow-md shadow-primary/30 disabled:opacity-40 active:scale-95 transition-all"
              aria-label="Enviar"
            >
              <span className="material-icons-round text-xl">send</span>
            </button>
          </div>
        </div>
      </Layout>
    );
  }

  // ============= LIST VIEW =============
  return (
    <Layout>
      <header className="sticky top-0 z-30 bg-white dark:bg-background-dark border-b border-gray-100 dark:border-slate-800">
        <div className="flex items-center justify-between px-4 py-4">
          <h1 className="text-xl font-semibold tracking-tight text-slate-800 dark:text-white">Mensajería</h1>
        </div>
      </header>

      <div className="px-4 py-4">
        <div className="relative group">
          <span className="material-icons-outlined absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-primary">search</span>
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-slate-100 dark:bg-slate-800 border-none rounded-2xl py-3.5 pl-12 pr-4 text-sm focus:ring-2 focus:ring-primary/20 placeholder:text-gray-500 dark:placeholder:text-slate-400 text-slate-800 dark:text-white outline-none"
            placeholder="Buscar conversaciones..."
            type="text"
          />
        </div>
      </div>

      <main className="flex-1 overflow-y-auto pb-4">
        {loading ? (
          <div className="px-4 py-4 space-y-4">
            <Skeleton className="h-20 rounded-2xl" />
            <Skeleton className="h-20 rounded-2xl" />
            <Skeleton className="h-20 rounded-2xl" />
          </div>
        ) : filtered.length === 0 ? (
          <EmptyState
            icon="chat_bubble_outline"
            title={search ? 'Sin resultados' : 'Sin mensajes'}
            description={
              search
                ? 'Prueba con otra búsqueda.'
                : 'Aún no tienes conversaciones. Contacta a un anfitrión desde un espacio.'
            }
          />
        ) : (
          filtered.map((c) => (
            <button
              key={c.id}
              onClick={() => setActiveId(c.id)}
              className="w-full text-left px-4 py-4 flex gap-3 border-b border-gray-100 dark:border-slate-800 hover:bg-gray-50 dark:hover:bg-slate-800/50"
            >
              <img
                alt={c.venue_name}
                className="w-14 h-14 rounded-full object-cover"
                src={c.venue_image}
              />
              <div className="flex-1 min-w-0">
                <div className="flex justify-between items-start mb-0.5">
                  <h3 className="font-semibold text-base truncate text-slate-800 dark:text-white">
                    {c.provider_name}
                  </h3>
                  <span className="text-xs text-gray-500 dark:text-slate-400 font-medium">
                    {formatTime(c.last_message_at)}
                  </span>
                </div>
                <p className="text-[13.5px] truncate mb-1 leading-tight text-gray-500 dark:text-slate-400">
                  {c.last_message || 'Sin mensajes aún'}
                </p>
                <p className="text-[12.5px] text-[#12B2C1] font-medium truncate">{c.venue_name}</p>
              </div>
            </button>
          ))
        )}
      </main>
    </Layout>
  );
};

export default Messages;
