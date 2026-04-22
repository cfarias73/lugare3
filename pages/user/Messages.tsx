
import React, { useState, useEffect } from 'react';
import Layout from '../../components/Layout';
import { useUser } from '../../context/UserContext';
import { Skeleton } from '../../components/ui/Skeleton';
import { EmptyState } from '../../components/ui/EmptyState';

const Messages: React.FC = () => {
  const [showModal, setShowModal] = useState(false);
  const { messages, sendMessage } = useUser();
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => setLoading(false), 1000);
    return () => clearTimeout(timer);
  }, []);

  const handleSendMessage = () => {
    if (newMessage.trim()) {
      sendMessage(newMessage);
      setNewMessage('');
      setShowModal(false);
    }
  };

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
          <button className="flex-1 py-3 text-sm font-semibold text-primary border-b-2 border-primary">
            Anfitriones
          </button>
          <button className="flex-1 py-3 text-sm font-medium text-gray-500 dark:text-slate-400 hover:text-gray-700 dark:hover:text-slate-200">
            Notificaciones
          </button>
        </div>
      </header>

      <div className="px-4 py-4">
        <div className="relative group">
          <span className="material-icons-outlined absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-primary transition-colors">search</span>
          <input 
            className="w-full bg-slate-100 dark:bg-slate-800 border-none rounded-2xl py-3.5 pl-12 pr-4 text-sm focus:ring-2 focus:ring-primary/20 placeholder:text-gray-500 dark:placeholder:text-slate-400 text-slate-800 dark:text-white transition-all outline-none" 
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
        ) : messages.length === 0 ? (
          <EmptyState 
            icon="chat_bubble_outline"
            title="Sin mensajes"
            description="Aún no tienes conversaciones activas."
          />
        ) : (
          messages.map((msg) => (
            <div 
              key={msg.id}
              className={`px-4 py-4 flex gap-3 border-b border-gray-100 dark:border-slate-800 cursor-pointer transition-colors ${msg.unreadCount ? 'bg-orange-50/50 dark:bg-orange-900/10' : 'hover:bg-gray-50 dark:hover:bg-slate-800/50'}`}
            >
              <div className="relative flex-shrink-0">
                <img 
                  alt={msg.sender} 
                  className={`w-14 h-14 rounded-full object-cover ${msg.unreadCount ? 'ring-2 ring-primary/10' : ''}`} 
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
                <p className={`text-[13.5px] truncate mb-1 leading-tight ${msg.unreadCount ? 'text-gray-800 dark:text-slate-200 font-medium' : 'text-gray-500 dark:text-slate-400'}`}>
                  {msg.content}
                </p>
                <p className="text-[12.5px] text-[#12B2C1] font-medium truncate">{msg.venueName}</p>
              </div>
              {msg.unreadCount && (
                <div className="flex flex-col justify-end items-end">
                  <span className="bg-primary text-white text-[10px] font-bold h-5 w-5 rounded-full flex items-center justify-center shadow-sm">
                    {msg.unreadCount}
                  </span>
                </div>
              )}
            </div>
          ))
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
              {/* Suggestions */}
              <div>
                <p className="text-xs font-bold text-slate-400 mb-3 uppercase tracking-wider">Sugeridos</p>
                <div className="flex gap-4 overflow-x-auto no-scrollbar pb-2">
                  {[
                      { name: 'Salón Mirador', img: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDAcc0AT-19OgO_LSENQ5VqhvxTYF2b3I5fcTDYHqW-abjQ2COUjS3HqTbGuJuFPL0sLDReMgVvaIaWetWICMGhmbfnJ424ewBRlUQF13N8MJF9goGOaa9d21yTiwfEfowX_uh3XXhfLL4mWBoD3dlDvW318BBFhrlmHB0A2ZLw_-0aWz2yRF2bZpQimAXodN6bGrCYIhYYLTdfeuvkaEiYZFJcwZUacuvjiUNkJz3OdO8LgTfbpsIXqK_wkYwya8jc3Pj502364yQs' },
                      { name: 'Terraza Urban', img: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDl94eGEAeYTbcbC2-3mahtkvteGawSR_8mbQ8vPMAv4cXqu39p-ICIKvDJ3m9Ga9fKVv7zPmvNg_HeYJHDI5nVUTM-kQXRBRSL9yl9F264cYt1GT9np0eeJKPmGLmcUAJos56jChUfYjU1V1wd2ce3PwS0QnmlqM477t1WtZc_hdqMFRB_SkIurTuX83z68GWsivLZAsmEN19sfgtYL6lqRU9PjkO9Ux0oa3Ee5G7W1-nEYgUYAUTRHtg023xhd3kBhqVVQJAD8a4x' },
                      { name: 'Loft Creativo', img: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDBJqOiPdshXk5hrnB8wdw2_eS0pQmmaq9dEUXQyyVHyQ1vbpxsX7_S0earK5_WHoA5Bk7KrGdXt9munqeWsKDP7jQTLtv3L2XDJ3qEITuebkibcUv_Ve25qWI7HR37KS7R2vP2Xk9_0UK8ADSZLAOhx_YQihjMpsmN3gi4_uY722DBWSnfS-2H0n15NnmY57Dwg-MIifenVVxUmXenVrtPjSp3jFyZOi5ib5jjo39nlKOGVTAG17oCq-x4LLJIkOiB_UdH2Rq9B7OG' }
                  ].map((item, idx) => (
                    <div key={idx} className="flex flex-col items-center gap-2 min-w-[80px] cursor-pointer group">
                      <div className="w-16 h-16 rounded-full p-0.5 border-2 border-transparent group-hover:border-primary transition-colors">
                          <img src={item.img} className="w-full h-full object-cover rounded-full" />
                      </div>
                      <span className="text-[11px] font-semibold text-slate-600 dark:text-slate-300 truncate w-full text-center leading-tight">{item.name}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <div className="flex justify-between items-center mb-3">
                    <label className="text-base font-bold text-slate-800 dark:text-white">Mensaje</label>
                    <button className="flex items-center gap-1.5 text-xs font-bold text-primary bg-orange-50 dark:bg-primary/20 px-4 py-2 rounded-full hover:bg-orange-100 dark:hover:bg-primary/30 transition-colors">
                        <span className="material-icons-round text-sm">auto_awesome</span>
                        Generar con IA
                    </button>
                </div>
                <div className="bg-slate-50 dark:bg-slate-800 rounded-3xl p-4 border border-slate-100 dark:border-slate-700 focus-within:border-primary/50 focus-within:ring-4 focus-within:ring-primary/10 transition-all">
                  <textarea 
                    rows={5}
                    placeholder="Escribe tu mensaje aquí..."
                    className="bg-transparent border-none outline-none text-sm w-full text-slate-800 dark:text-white placeholder:text-slate-400 resize-none"
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                  ></textarea>
                  <div className="flex items-center gap-2 mt-2 pt-3 border-t border-slate-200 dark:border-slate-700/50">
                    <button className="p-2 text-slate-400 hover:text-primary transition-colors rounded-xl hover:bg-white dark:hover:bg-slate-700">
                        <span className="material-icons-outlined text-xl">image</span>
                    </button>
                    <button className="p-2 text-slate-400 hover:text-primary transition-colors rounded-xl hover:bg-white dark:hover:bg-slate-700">
                        <span className="material-icons-outlined text-xl">attach_file</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>

            <div className="p-6 border-t border-gray-100 dark:border-slate-800 bg-white dark:bg-surface-dark sticky bottom-0">
              <button 
                onClick={handleSendMessage}
                className="w-full bg-primary hover:bg-orange-600 text-white font-bold py-4 rounded-2xl shadow-lg shadow-primary/30 flex items-center justify-center gap-2 active:scale-[0.98] transition-all"
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
