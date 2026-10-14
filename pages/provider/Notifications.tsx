import React, { useEffect, useState, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import ProviderLayout from '../../components/ProviderLayout';
import { useUser } from '../../context/UserContext';
import { Skeleton } from '../../components/ui/Skeleton';
import { EmptyState } from '../../components/ui/EmptyState';
import {
  listNotifications,
  markAllNotificationsAsRead,
  markNotificationAsRead,
  deleteNotification,
  sendTestNotification,
  Notification,
} from '../../src/services/notificationService';
import { toast } from 'sonner';

type TabKey = 'todas' | 'reservas' | 'mensajes' | 'pagos';
type SortKey = 'recientes' | 'antiguas' | 'no_leidas';

const TABS: { key: TabKey; label: string; match?: (n: Notification) => boolean }[] = [
  { key: 'todas', label: 'Todas' },
  { key: 'reservas', label: 'Reservas', match: (n) => /reserv|cancel/i.test(n.title || '') || /reserv|cancel/i.test(n.message) || (n.link || '').includes('booking') },
  { key: 'mensajes', label: 'Mensajes', match: (n) => /mensaj|consulta|chat/i.test(n.title || '') || /mensaj|consulta/i.test(n.message) || (n.link || '').includes('message') },
  { key: 'pagos', label: 'Pagos', match: (n) => /pago|payment|cobro|transferen/i.test(n.title || '') || /pago|payment/i.test(n.message) },
];

const SORT_OPTIONS: { key: SortKey; label: string }[] = [
  { key: 'recientes', label: 'Recientes' },
  { key: 'antiguas', label: 'Más antiguas' },
  { key: 'no_leidas', label: 'No leídas primero' },
];

const typeStyle = (t: Notification['type']) => {
  switch (t) {
    case 'success': return { icon: 'check_circle', color: 'text-teal-500', bg: 'bg-teal-50 dark:bg-teal-900/20', border: 'border-teal-400' };
    case 'warning': return { icon: 'warning_amber', color: 'text-amber-500', bg: 'bg-amber-50 dark:bg-amber-900/20', border: 'border-amber-400' };
    case 'error':   return { icon: 'error_outline', color: 'text-red-500', bg: 'bg-red-50 dark:bg-red-900/20', border: 'border-red-400' };
    default:        return { icon: 'notifications', color: 'text-primary', bg: 'bg-orange-50 dark:bg-orange-900/20', border: 'border-primary' };
  }
};

const relative = (iso: string) => {
  const diff = (Date.now() - new Date(iso).getTime()) / 1000;
  if (diff < 60) return 'Ahora';
  if (diff < 3600) return `Hace ${Math.floor(diff / 60)} min`;
  if (diff < 86400) return `Hace ${Math.floor(diff / 3600)} h`;
  const d = new Date(iso);
  return `${d.toLocaleDateString()} ${d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
};

const Notifications: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useUser();
  const [items, setItems] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<TabKey>('todas');
  const [sort, setSort] = useState<SortKey>('recientes');
  const [showSortMenu, setShowSortMenu] = useState(false);

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

  const filtered = useMemo(() => {
    const tabCfg = TABS.find(t => t.key === tab);
    let list = items.filter(n => !tabCfg?.match || tabCfg.match(n));
    if (sort === 'recientes') list = [...list].sort((a, b) => +new Date(b.created_at) - +new Date(a.created_at));
    else if (sort === 'antiguas') list = [...list].sort((a, b) => +new Date(a.created_at) - +new Date(b.created_at));
    else if (sort === 'no_leidas') list = [...list].sort((a, b) => Number(a.read) - Number(b.read) || +new Date(b.created_at) - +new Date(a.created_at));
    return list;
  }, [items, tab, sort]);

  const sortLabel = SORT_OPTIONS.find(s => s.key === sort)?.label || 'Recientes';

  const handleTest = async () => {
    if (!user) return;
    try {
      const created = await sendTestNotification(user.id, 'provider');
      if (created) setItems((prev) => [created, ...prev]);
      toast.success('Notificación de prueba enviada exitosamente');
    } catch (e: any) {
      toast.error('Error al enviar: ' + (e.message || 'RLS error'));
    }
  };

  return (
    <ProviderLayout>
      <header className="sticky top-0 z-50 bg-white dark:bg-card-dark shadow-sm px-4 pt-10 pb-3 transition-colors">
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-3">
            <button onClick={() => navigate(-1)} className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full">
              <span className="material-icons-round text-slate-800 dark:text-slate-100">arrow_back</span>
            </button>
            <h1 className="text-xl font-bold dark:text-white font-display tracking-tight">Centro de Notificaciones</h1>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleTest}
              className="text-xs font-semibold text-slate-500 hover:text-primary dark:text-slate-400 border border-slate-200 dark:border-slate-700 rounded-lg px-2.5 py-1 transition-colors"
            >
              Probar envío
            </button>
            <button
              onClick={handleMarkAll}
              title="Marcar todas como leídas"
              className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full"
            >
              <span className="material-icons-round text-slate-800 dark:text-slate-100">done_all</span>
            </button>
          </div>
        </div>
        <div className="flex justify-between items-center text-[13px] font-bold uppercase tracking-wider border-b border-slate-100 dark:border-slate-800 no-scrollbar overflow-x-auto">
          {TABS.map(t => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`px-4 py-3 whitespace-nowrap transition-colors ${
                tab === t.key
                  ? 'border-b-2 border-primary text-primary'
                  : 'text-slate-400 dark:text-slate-500 hover:text-slate-600'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
      </header>

      <div className="flex justify-end items-center px-4 py-4">
        <div className="relative">
          <button
            onClick={() => setShowSortMenu(v => !v)}
            className="flex items-center gap-1.5 bg-white dark:bg-card-dark px-5 py-2.5 rounded-full shadow-sm text-sm font-bold border border-slate-50 dark:border-slate-800 active:scale-95 transition-all"
          >
            <span className="dark:text-white">{sortLabel}</span>
            <span className="material-icons-round text-primary">expand_more</span>
          </button>
          {showSortMenu && (
            <div className="absolute right-0 top-full mt-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl shadow-xl p-2 z-30 min-w-[200px]">
              {SORT_OPTIONS.map(opt => (
                <button
                  key={opt.key}
                  onClick={() => { setSort(opt.key); setShowSortMenu(false); }}
                  className={`w-full text-left px-3 py-2 rounded-xl text-sm font-medium transition-colors ${sort === opt.key ? 'bg-primary/10 text-primary' : 'hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200'}`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      <main className="px-4 pb-10">
        {loading ? (
          <div className="space-y-3">
            <Skeleton className="h-20 rounded-2xl" />
            <Skeleton className="h-20 rounded-2xl" />
            <Skeleton className="h-20 rounded-2xl" />
          </div>
        ) : filtered.length === 0 ? (
          <EmptyState
            icon="notifications_none"
            title="Sin notificaciones"
            description="Aquí verás avisos sobre tus reservas, mensajes y pagos."
          />
        ) : (
          <div className="space-y-4">
            {filtered.map((n) => {
              const s = typeStyle(n.type);
              return (
                <button
                  key={n.id}
                  onClick={() => handleClick(n)}
                  className={`w-full text-left bg-white dark:bg-card-dark rounded-2xl shadow-sm overflow-hidden flex border-l-4 ${s.border} transition-all active:scale-[0.99] border dark:border-slate-800`}
                >
                  <div className="p-4 flex gap-5 w-full relative">
                    <div className={`w-12 h-12 rounded-2xl ${s.bg} flex items-center justify-center shrink-0 shadow-sm`}>
                      <span className={`material-icons-round ${s.color} text-2xl`}>{s.icon}</span>
                    </div>
                    <div className="flex flex-col flex-1 pr-4">
                      <p className="text-[14px] leading-snug dark:text-slate-200">
                        {n.title && <span className="font-bold text-slate-900 dark:text-white">{n.title} </span>}
                        {n.message}
                      </p>
                      <span className="text-[11px] text-slate-400 font-bold uppercase tracking-wider mt-2">{relative(n.created_at)}</span>
                    </div>
                    {!n.read && (
                      <div className="absolute right-5 top-5 w-2.5 h-2.5 rounded-full bg-primary shadow-[0_0_8px_rgba(242,107,58,0.5)]"></div>
                    )}
                    <span
                      onClick={(e) => handleDelete(n.id, e)}
                      className="absolute right-4 bottom-4 material-icons-outlined text-[18px] text-slate-300 hover:text-red-500 cursor-pointer"
                    >close</span>
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </main>
    </ProviderLayout>
  );
};

export default Notifications;
