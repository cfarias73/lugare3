
import React from 'react';
import { useNavigate } from 'react-router-dom';
import ProviderLayout from '../../components/ProviderLayout';

const Messages: React.FC = () => {
  const navigate = useNavigate();

  const MOCK_CHATS = [
    { id: 1, name: 'María Rodríguez', message: 'Hola, tengo una pregunta sobr...', time: '10:30', unread: 2, avatar: 'https://i.pravatar.cc/150?u=maria', online: true },
    { id: 2, name: 'Carlos Gómez', message: 'Gracias por la información sobre el...', time: 'Ayer', unread: 0, avatar: 'https://i.pravatar.cc/150?u=carlos', online: false },
    { id: 3, name: 'Laura Martínez', message: '¿El salón tiene capacidad para 50 p...', time: 'Ayer', unread: 0, avatar: 'https://i.pravatar.cc/150?u=laura', online: true },
    { id: 4, name: 'Javier López', message: 'Confirmado para el sábado. ¡Gracia...', time: 'Lun', unread: 0, avatar: 'https://i.pravatar.cc/150?u=javier', online: false },
  ];

  return (
    <ProviderLayout>
      <header className="bg-white dark:bg-card-dark px-4 py-3 flex items-center justify-between sticky top-0 z-30">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate(-1)} className="p-1">
            <span className="material-icons-outlined text-slate-800 dark:text-slate-200">arrow_back</span>
          </button>
          <h1 className="text-xl font-bold text-slate-800 dark:text-slate-100 font-display">Mensajes</h1>
        </div>
        <button className="text-secondary">
          <span className="material-icons-outlined">edit_note</span>
        </button>
      </header>

      <div className="bg-white dark:bg-card-dark border-b border-slate-100 dark:border-slate-800">
        <div className="flex">
          <button className="flex-1 py-3 text-center border-b-2 border-primary text-primary font-semibold">
            Chats
          </button>
          <button 
            onClick={() => navigate('/provider/notifications')}
            className="flex-1 py-3 text-center text-slate-400 dark:text-zinc-500 font-medium"
          >
            Notificaciones
          </button>
        </div>
      </div>

      <main className="p-4 space-y-4">
        <div className="relative">
          <span className="material-icons-outlined absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">search</span>
          <input 
            className="w-full bg-white dark:bg-zinc-800 border-none rounded-xl py-3 pl-12 pr-4 text-sm placeholder:text-slate-400 focus:ring-2 focus:ring-primary/20 transition-all shadow-sm dark:text-white" 
            placeholder="Buscar mensajes" 
            type="text"
          />
        </div>

        <div className="space-y-3">
          {MOCK_CHATS.map((chat) => (
            <div key={chat.id} className="bg-white dark:bg-card-dark p-4 rounded-2xl flex gap-3 shadow-sm hover:shadow-md transition-shadow cursor-pointer border border-slate-50 dark:border-zinc-800/50">
              <div className="relative h-14 w-14 flex-shrink-0">
                <img alt={chat.name} className="h-full w-full rounded-full object-cover" src={chat.avatar} loading="lazy" />
                <div className={`absolute bottom-0 right-0 w-4 h-4 ${chat.online ? 'bg-green-500' : 'bg-slate-300 dark:bg-zinc-600'} border-2 border-white dark:border-card-dark rounded-full`}></div>
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex justify-between items-start mb-0.5">
                  <h3 className="font-semibold text-slate-800 dark:text-white truncate">{chat.name}</h3>
                  <span className="text-xs text-slate-400">{chat.time}</span>
                </div>
                <div className="flex justify-between items-center gap-2">
                  <p className="text-sm text-slate-500 dark:text-zinc-400 truncate leading-snug">{chat.message}</p>
                  {chat.unread > 0 && (
                    <span className="bg-primary text-white text-[10px] font-bold h-5 w-5 rounded-full flex items-center justify-center shrink-0">
                      {chat.unread}
                    </span>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </main>
    </ProviderLayout>
  );
};

export default Messages;
