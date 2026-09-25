import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../../components/Layout';
import { useUser } from '../../context/UserContext';
import { Skeleton } from '../../components/ui/Skeleton';
import { EmptyState } from '../../components/ui/EmptyState';
import {
  listNotifications,
  markAllNotificationsAsRead,
  markNotificationAsRead,
  deleteNotification,
  Notification,
} from '../../src/services/notificationService';

const typeIcon = (t: Notification['type']) => {
  switch (t) {
    case 'success': return { icon: 'check_circle', color: 'text-green-500 bg-green-50 dark:bg-green-900/20' };
    case 'warning': return { icon: 'warning_amber', color: 'text-amber-500 bg-amber-50 dark:bg-amber-900/20' };
    case 'error':   return { icon: 'error_outline', color: 'text-red-500 bg-red-50 dark:bg-red-900/20' };
    default:        return { icon: 'notifications', color: 'text-primary bg-orange-50 dark:bg-orange-900/20' };
  }
};

const relative = (iso: string) => {
  const diff = (Date.now() - new Date(iso).getTime()) / 1000;
  if (diff < 60) return 'Ahora';
  if (diff < 3600) return `${Math.floor(diff / 60)} min`;
  if (diff < 86400) return `${Math.floor(diff / 3600)} h`;
  return `${Math.floor(diff / 86400)} d`;
};

const Notifications: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useUser();
  const [items, setItems] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    setItems(await listNotifications(user.id));
    setLoading(false);
  }, [user]);

  useEffect(() => { load(); }, [load]);

  const handleClick = async (n: Notification) => {
    if (!n.read) {
      try { await markNotificationAsRead(n.id); } catch {}
      setItems((prev) => prev.map((x) => x.id === n.id ? { ...x, read: true } : x));
    }
    if (n.link) navigate(n.link);
  };

  const handleMarkAll = async () => {
    if (!user) return;
    try { await markAllNotificationsAsRead(user.id); } catch {}
    setItems((prev) => prev.map((x) => ({ ...x, read: true })));
  };

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try { await deleteNotification(id); } catch {}
    setItems((prev) => prev.filter((x) => x.id !== id));
  };

  const unread = items.filter((i) => !i.read).length;

  return (
    <Layout>
      <header className="sticky top-0 z-30 bg-white dark:bg-background-dark border-b border-gray-100 dark:border-slate-800">
        <div className="flex items-center justify-between px-3 py-3">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => { if (window.history.length > 1) navigate(-1); else navigate('/user/home'); }}
              className="p-2 min-h-[44px] min-w-[44px] flex items-center justify-center rounded-full hover:bg-gray-100 dark:hover:bg-slate-800 active:scale-95 transition-all"
              aria-label="Volver"
            >
              <span className="material-icons-outlined text-slate-700 dark:text-white">arrow_back</span>
            </button>
            <h1 className="text-lg font-bold text-slate-800 dark:text-white">Notificaciones</h1>
            {unread > 0 && (
              <span className="bg-primary text-white text-[10px] font-bold px-2 py-0.5 rounded-full">{unread}</span>
            )}
          </div>
          {unread > 0 && (
            <button onClick={handleMarkAll} className="text-xs font-semibold text-primary hover:underline px-2">
              Marcar todas leídas
            </button>
          )}
        </div>
      </header>

      <main className="flex-1 overflow-y-auto">
        {loading ? (
          <div className="p-4 space-y-3">
            <Skeleton className="h-20 rounded-2xl" />
            <Skeleton className="h-20 rounded-2xl" />
            <Skeleton className="h-20 rounded-2xl" />
          </div>
        ) : items.length === 0 ? (
          <EmptyState
            icon="notifications_none"
            title="Sin notificaciones"
            description="Aquí verás avisos sobre tus reservas, mensajes y más."
          />
        ) : (
          <ul>
            {items.map((n) => {
              const ti = typeIcon(n.type);
              return (
                <li key={n.id}>
                  <button
                    onClick={() => handleClick(n)}
                    className={`w-full text-left px-4 py-4 flex gap-3 border-b border-gray-100 dark:border-slate-800 transition-colors ${
                      !n.read ? 'bg-orange-50/40 dark:bg-orange-900/10' : 'hover:bg-gray-50 dark:hover:bg-slate-800/50'
                    }`}
                  >
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${ti.color}`}>
                      <span className="material-icons-outlined text-[20px]">{ti.icon}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-start gap-2">
                        {n.title && (
                          <h3 className="font-semibold text-[14px] text-slate-800 dark:text-white truncate">{n.title}</h3>
                        )}
                        <span className="text-[11px] text-slate-400 font-medium flex-shrink-0">{relative(n.created_at)}</span>
                      </div>
                      <p className="text-[13px] text-slate-600 dark:text-slate-300 leading-snug">{n.message}</p>
                    </div>
                    <button
                      onClick={(e) => handleDelete(n.id, e)}
                      className="p-1 text-slate-300 hover:text-red-500"
                      aria-label="Eliminar"
                    >
                      <span className="material-icons-outlined text-[18px]">close</span>
                    </button>
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </main>
    </Layout>
  );
};

export default Notifications;
