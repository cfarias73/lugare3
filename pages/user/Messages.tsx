
import React, { useState, useEffect, useMemo, useRef } from 'react';
import Layout from '../../components/Layout';
import { useUser } from '../../context/UserContext';
import { Skeleton } from '../../components/ui/Skeleton';
import { EmptyState } from '../../components/ui/EmptyState';
import { Message } from '../../types';

type ChatAttachment = {
  name: string;
  size: number;
  type: string;
  url: string; // object URL or data URL
  isImage: boolean;
};

type ChatBubble = {
  id: string;
  from: 'me' | 'them';
  text: string;
  time: string;
  attachment?: ChatAttachment;
};

const formatNow = () =>
  new Date().toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' });

const Messages: React.FC = () => {
  const { messages, sendMessage } = useUser();
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<'hosts' | 'notifications'>('hosts');
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [newMessage, setNewMessage] = useState('');

  // Open conversation state
  const [activeId, setActiveId] = useState<string | null>(null);
  const [threads, setThreads] = useState<Record<string, ChatBubble[]>>({});
  const [unreadCleared, setUnreadCleared] = useState<Record<string, boolean>>({});
  const [draft, setDraft] = useState('');
  const [toast, setToast] = useState<string | null>(null);
  const [showChatMenu, setShowChatMenu] = useState(false);
  const scrollRef = useRef<HTMLDivElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [pendingAttachment, setPendingAttachment] = useState<ChatAttachment | null>(null);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 2200);
  };

  useEffect(() => {
    const timer = setTimeout(() => setLoading(false), 600);
    return () => clearTimeout(timer);
  }, []);

  const activeConversation: Message | null = useMemo(
    () => messages.find((m) => m.id === activeId) || null,
    [activeId, messages]
  );

  // Seed a thread the first time you open a conversation
  useEffect(() => {
    if (!activeConversation) return;
    setThreads((prev) => {
      if (prev[activeConversation.id]) return prev;
      return {
        ...prev,
        [activeConversation.id]: [
          {
            id: `${activeConversation.id}-seed-1`,
            from: 'them',
            text: `Hola, soy ${activeConversation.sender}. ¿En qué puedo ayudarte con ${activeConversation.venueName}?`,
            time: '10:20',
          },
          {
            id: `${activeConversation.id}-seed-2`,
            from: 'them',
            text: activeConversation.content,
            time: activeConversation.time,
          },
        ],
      };
    });
    setUnreadCleared((p) => ({ ...p, [activeConversation.id]: true }));
  }, [activeConversation]);

  // Auto-scroll thread to bottom on new message
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [activeId, threads]);

  const filteredMessages = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return messages;
    return messages.filter(
      (m) =>
        m.sender.toLowerCase().includes(q) ||
        m.venueName.toLowerCase().includes(q) ||
        m.content.toLowerCase().includes(q)
    );
  }, [messages, search]);

  const handleSendNewMessage = () => {
    if (newMessage.trim()) {
      sendMessage(newMessage);
      setNewMessage('');
      setShowModal(false);
    }
  };

  const handleSendReply = () => {
    const text = draft.trim();
    if ((!text && !pendingAttachment) || !activeConversation) return;
    const att = pendingAttachment;
    setThreads((prev) => ({
      ...prev,
      [activeConversation.id]: [
        ...(prev[activeConversation.id] || []),
        { id: `${Date.now()}-me`, from: 'me', text, time: formatNow(), attachment: att || undefined },
      ],
    }));
    setDraft('');
    setPendingAttachment(null);
    // Simulated reply
    setTimeout(() => {
      setThreads((prev) => ({
        ...prev,
        [activeConversation.id]: [
          ...(prev[activeConversation.id] || []),
          {
            id: `${Date.now()}-them`,
            from: 'them',
            text: att ? '¡Recibido! Gracias por el archivo 🙌' : 'Gracias por tu mensaje, te respondo en breve 🙌',
            time: formatNow(),
          },
        ],
      }));
    }, 1200);
  };

  const handleFileSelected = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    const MAX = 10 * 1024 * 1024;
    if (file.size > MAX) {
      showToast('El archivo supera 10 MB');
      return;
    }
    const isImage = file.type.startsWith('image/');
    const url = URL.createObjectURL(file);
    setPendingAttachment({ name: file.name, size: file.size, type: file.type, url, isImage });
    showToast(`Archivo listo: ${file.name}`);
  };


  // ============= CONVERSATION (CHAT THREAD) VIEW =============
  if (activeConversation) {
    const thread = threads[activeConversation.id] || [];
    return (
      <Layout>
        <header className="sticky top-0 z-30 bg-white dark:bg-background-dark border-b border-gray-100 dark:border-slate-800">
          <div className="flex items-center gap-3 px-3 py-3">
            <button
              onClick={() => setActiveId(null)}
              className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-slate-800 transition-colors"
              aria-label="Volver"
            >
              <span className="material-icons-outlined text-slate-700 dark:text-white">arrow_back</span>
            </button>
            <div className="relative flex-shrink-0">
              <img
                src={activeConversation.avatar}
                alt={activeConversation.sender}
                className="w-10 h-10 rounded-full object-cover"
              />
              {activeConversation.isOnline && (
                <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-white dark:border-background-dark rounded-full" />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <h2 className="font-semibold text-slate-800 dark:text-white truncate text-[15px] leading-tight">
                {activeConversation.sender}
              </h2>
              <p className="text-[11.5px] text-[#12B2C1] font-medium truncate">
                {activeConversation.venueName}
                {activeConversation.isOnline && (
                  <span className="text-green-500 ml-2">• En línea</span>
                )}
              </p>
            </div>
            <button
              onClick={() => showToast(`Llamando a ${activeConversation.sender}...`)}
              className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-slate-800 transition-colors"
              aria-label="Llamar"
            >
              <span className="material-icons-outlined text-slate-700 dark:text-white">call</span>
            </button>
            <div className="relative">
              <button
                onClick={() => setShowChatMenu((v) => !v)}
                className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-slate-800 transition-colors"
                aria-label="Más opciones"
              >
                <span className="material-icons-outlined text-slate-700 dark:text-white">more_vert</span>
              </button>
              {showChatMenu && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setShowChatMenu(false)} />
                  <div className="absolute right-0 mt-2 w-52 bg-white dark:bg-slate-800 rounded-xl shadow-xl border border-slate-100 dark:border-slate-700 overflow-hidden z-50">
                    <button
                      onClick={() => { setShowChatMenu(false); showToast('Conversación silenciada'); }}
                      className="w-full text-left px-4 py-2.5 text-sm text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700/50 flex items-center gap-2"
                    >
                      <span className="material-icons-outlined text-base">notifications_off</span>
                      Silenciar
                    </button>
                    <button
                      onClick={() => { setShowChatMenu(false); showToast('Conversación archivada'); }}
                      className="w-full text-left px-4 py-2.5 text-sm text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700/50 flex items-center gap-2"
                    >
                      <span className="material-icons-outlined text-base">archive</span>
                      Archivar
                    </button>
                    <button
                      onClick={() => {
                        setShowChatMenu(false);
                        setThreads((p) => ({ ...p, [activeConversation.id]: [] }));
                        showToast('Mensajes eliminados');
                      }}
                      className="w-full text-left px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 flex items-center gap-2"
                    >
                      <span className="material-icons-outlined text-base">delete_outline</span>
                      Vaciar chat
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </header>

        {toast && (
          <div className="fixed top-20 left-1/2 -translate-x-1/2 z-[200] bg-slate-900 text-white text-sm px-4 py-2 rounded-full shadow-lg animate-[fadeIn_0.2s_ease-out]">
            {toast}
          </div>
        )}

        <main
          ref={scrollRef}
          className="flex-1 overflow-y-auto px-4 py-4 space-y-3 bg-slate-50 dark:bg-slate-900/40"
        >
          {thread.map((b) => (
            <div
              key={b.id}
              className={`flex ${b.from === 'me' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[78%] px-4 py-2.5 rounded-2xl shadow-sm text-[14px] leading-snug ${
                  b.from === 'me'
                    ? 'bg-primary text-white rounded-br-md'
                    : 'bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 rounded-bl-md border border-slate-100 dark:border-slate-700'
                }`}
              >
                {b.attachment && (
                  b.attachment.isImage ? (
                    <a href={b.attachment.url} target="_blank" rel="noreferrer" className="block mb-1.5">
                      <img src={b.attachment.url} alt={b.attachment.name} className="rounded-lg max-h-56 w-auto object-cover" />
                    </a>
                  ) : (
                    <a
                      href={b.attachment.url}
                      download={b.attachment.name}
                      className={`flex items-center gap-2 mb-1.5 px-2.5 py-2 rounded-lg ${b.from === 'me' ? 'bg-white/15 hover:bg-white/25' : 'bg-slate-100 dark:bg-slate-700/60 hover:bg-slate-200 dark:hover:bg-slate-700'} transition-colors`}
                    >
                      <span className="material-icons-outlined text-base">description</span>
                      <span className="text-xs font-medium truncate max-w-[180px]">{b.attachment.name}</span>
                      <span className={`text-[10px] ${b.from === 'me' ? 'text-white/70' : 'text-slate-400'}`}>
                        {(b.attachment.size / 1024).toFixed(0)} KB
                      </span>
                    </a>
                  )
                )}
                {b.text && <p className="whitespace-pre-wrap break-words">{b.text}</p>}
                <p
                  className={`text-[10.5px] mt-1 text-right ${
                    b.from === 'me' ? 'text-white/70' : 'text-slate-400'
                  }`}
                >
                  {b.time}
                </p>
              </div>
            </div>
          ))}
        </main>

        <div className="sticky bottom-0 bg-white dark:bg-background-dark border-t border-gray-100 dark:border-slate-800 px-3 py-3">
          {pendingAttachment && (
            <div className="mb-2 flex items-center gap-2 bg-slate-100 dark:bg-slate-800 rounded-xl px-3 py-2">
              {pendingAttachment.isImage ? (
                <img src={pendingAttachment.url} alt={pendingAttachment.name} className="h-10 w-10 rounded object-cover" />
              ) : (
                <span className="material-icons-outlined text-slate-500">description</span>
              )}
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium text-slate-800 dark:text-slate-100 truncate">{pendingAttachment.name}</p>
                <p className="text-[10px] text-slate-400">{(pendingAttachment.size / 1024).toFixed(0)} KB</p>
              </div>
              <button
                onClick={() => {
                  URL.revokeObjectURL(pendingAttachment.url);
                  setPendingAttachment(null);
                }}
                className="p-1 text-slate-400 hover:text-red-500"
                aria-label="Quitar adjunto"
              >
                <span className="material-icons-outlined text-base">close</span>
              </button>
            </div>
          )}
          <input
            ref={fileInputRef}
            type="file"
            className="hidden"
            accept="image/*,application/pdf,.doc,.docx,.xls,.xlsx,.txt"
            onChange={handleFileSelected}
          />
          <div className="flex items-end gap-2">
            <button
              onClick={() => fileInputRef.current?.click()}
              className="p-2.5 text-slate-400 hover:text-primary rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              aria-label="Adjuntar archivo"
            >
              <span className="material-icons-outlined text-xl">attach_file</span>
            </button>
            <div className="flex-1 bg-slate-100 dark:bg-slate-800 rounded-2xl px-4 py-2.5 focus-within:ring-2 focus-within:ring-primary/30 transition-all">
              <textarea
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSendReply();
                  }
                }}
                rows={1}
                placeholder="Escribe un mensaje..."
                className="bg-transparent border-none outline-none resize-none w-full text-sm text-slate-800 dark:text-white placeholder:text-slate-400 max-h-32"
              />
            </div>
            <button
              onClick={handleSendReply}
              disabled={!draft.trim() && !pendingAttachment}
              className="w-11 h-11 flex-shrink-0 bg-primary text-white rounded-full flex items-center justify-center shadow-md shadow-primary/30 hover:bg-orange-600 disabled:opacity-40 disabled:cursor-not-allowed active:scale-95 transition-all"
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
          <button className="p-1 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-full transition-colors">
            <span className="material-icons-outlined text-slate-800 dark:text-white">more_vert</span>
          </button>
        </div>
        <div className="flex border-b border-gray-100 dark:border-slate-800">
          <button
            onClick={() => setTab('hosts')}
            className={`flex-1 py-3 text-sm font-semibold transition-colors ${
              tab === 'hosts'
                ? 'text-primary border-b-2 border-primary'
                : 'text-gray-500 dark:text-slate-400 hover:text-gray-700 dark:hover:text-slate-200'
            }`}
          >
            Anfitriones
          </button>
          <button
            onClick={() => setTab('notifications')}
            className={`flex-1 py-3 text-sm font-semibold transition-colors ${
              tab === 'notifications'
                ? 'text-primary border-b-2 border-primary'
                : 'text-gray-500 dark:text-slate-400 hover:text-gray-700 dark:hover:text-slate-200'
            }`}
          >
            Notificaciones
          </button>
        </div>
      </header>

      {tab === 'hosts' && (
        <div className="px-4 py-4">
          <div className="relative group">
            <span className="material-icons-outlined absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-primary transition-colors">search</span>
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-slate-100 dark:bg-slate-800 border-none rounded-2xl py-3.5 pl-12 pr-4 text-sm focus:ring-2 focus:ring-primary/20 placeholder:text-gray-500 dark:placeholder:text-slate-400 text-slate-800 dark:text-white transition-all outline-none"
              placeholder="Buscar conversaciones..."
              type="text"
            />
          </div>
        </div>
      )}

      <main className="flex-1 overflow-y-auto pb-4">
        {tab === 'notifications' ? (
          <EmptyState
            icon="notifications_none"
            title="Sin notificaciones"
            description="Aquí verás notificaciones sobre tus reservas y mensajes."
          />
        ) : loading ? (
          <div className="px-4 py-4 space-y-4">
            <Skeleton className="h-20 rounded-2xl" />
            <Skeleton className="h-20 rounded-2xl" />
            <Skeleton className="h-20 rounded-2xl" />
          </div>
        ) : filteredMessages.length === 0 ? (
          <EmptyState
            icon="chat_bubble_outline"
            title={search ? 'Sin resultados' : 'Sin mensajes'}
            description={search ? 'Prueba con otra búsqueda.' : 'Aún no tienes conversaciones activas.'}
          />
        ) : (
          filteredMessages.map((msg) => {
            const cleared = unreadCleared[msg.id];
            const showUnread = msg.unreadCount && !cleared;
            return (
              <button
                key={msg.id}
                onClick={() => setActiveId(msg.id)}
                className={`w-full text-left px-4 py-4 flex gap-3 border-b border-gray-100 dark:border-slate-800 cursor-pointer transition-colors ${
                  showUnread ? 'bg-orange-50/50 dark:bg-orange-900/10' : 'hover:bg-gray-50 dark:hover:bg-slate-800/50'
                }`}
              >
                <div className="relative flex-shrink-0">
                  <img
                    alt={msg.sender}
                    className={`w-14 h-14 rounded-full object-cover ${showUnread ? 'ring-2 ring-primary/10' : ''}`}
                    src={msg.avatar}
                  />
                  {msg.isOnline && (
                    <div className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-green-500 border-2 border-white dark:border-background-dark rounded-full"></div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-start mb-0.5">
                    <h3 className="font-semibold text-base truncate text-slate-800 dark:text-white">{msg.sender}</h3>
                    <span className="text-xs text-gray-500 dark:text-slate-400 font-medium">{msg.time}</span>
                  </div>
                  <p className={`text-[13.5px] truncate mb-1 leading-tight ${showUnread ? 'text-gray-800 dark:text-slate-200 font-medium' : 'text-gray-500 dark:text-slate-400'}`}>
                    {msg.content}
                  </p>
                  <p className="text-[12.5px] text-[#12B2C1] font-medium truncate">{msg.venueName}</p>
                </div>
                {showUnread && (
                  <div className="flex flex-col justify-end items-end">
                    <span className="bg-primary text-white text-[10px] font-bold h-5 w-5 rounded-full flex items-center justify-center shadow-sm">
                      {msg.unreadCount}
                    </span>
                  </div>
                )}
              </button>
            );
          })
        )}
      </main>

      {/* Floating Action Button */}
      <div className="fixed bottom-28 inset-x-0 max-w-md mx-auto px-6 z-40 pointer-events-none flex justify-end">
        <button
          onClick={() => setShowModal(true)}
          className="w-14 h-14 bg-primary text-white rounded-full shadow-lg shadow-primary/30 flex items-center justify-center hover:scale-105 active:scale-95 transition-transform pointer-events-auto"
        >
          <span className="material-icons-outlined text-3xl">add</span>
        </button>
      </div>

      {/* New Message Modal */}
      {showModal && (
        <div className="fixed inset-0 z-[100] flex items-end justify-center sm:items-center px-0 sm:px-4 pb-0 sm:pb-4">
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity"
            onClick={() => setShowModal(false)}
          ></div>

          <div className="relative bg-white dark:bg-surface-dark w-full max-w-md rounded-t-3xl sm:rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh] animate-[slideUp_0.3s_ease-out]">
            <div className="px-6 py-5 border-b border-gray-100 dark:border-slate-800 flex justify-between items-center bg-white dark:bg-surface-dark sticky top-0 z-10">
              <h2 className="text-xl font-bold text-slate-800 dark:text-white font-display">Nuevo mensaje</h2>
              <button
                onClick={() => setShowModal(false)}
                className="p-2 bg-gray-100 dark:bg-slate-800 rounded-full hover:bg-gray-200 dark:hover:bg-slate-700 transition-colors"
              >
                <span className="material-icons-round text-slate-500 text-lg">close</span>
              </button>
            </div>

            <div className="p-6 space-y-6 overflow-y-auto">
              <div>
                <div className="flex justify-between items-center mb-3">
                  <label className="text-base font-bold text-slate-800 dark:text-white">Mensaje</label>
                </div>
                <div className="bg-slate-50 dark:bg-slate-800 rounded-3xl p-4 border border-slate-100 dark:border-slate-700 focus-within:border-primary/50 focus-within:ring-4 focus-within:ring-primary/10 transition-all">
                  <textarea
                    rows={5}
                    placeholder="Escribe tu mensaje aquí..."
                    className="bg-transparent border-none outline-none text-sm w-full text-slate-800 dark:text-white placeholder:text-slate-400 resize-none"
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                  ></textarea>
                </div>
              </div>
            </div>

            <div className="p-6 border-t border-gray-100 dark:border-slate-800 bg-white dark:bg-surface-dark sticky bottom-0">
              <button
                onClick={handleSendNewMessage}
                disabled={!newMessage.trim()}
                className="w-full bg-primary hover:bg-orange-600 disabled:opacity-50 text-white font-bold py-4 rounded-2xl shadow-lg shadow-primary/30 flex items-center justify-center gap-2 active:scale-[0.98] transition-all"
              >
                <span>Enviar mensaje</span>
                <span className="material-icons-round text-lg">send</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
};

export default Messages;
