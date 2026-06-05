
import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import ProviderLayout from '../../components/ProviderLayout';

type NotifType = 'consulta' | 'reserva' | 'pago' | 'reseña' | 'cancelacion';
type TabKey = 'todas' | 'reservas' | 'mensajes' | 'pagos';
type SortKey = 'recientes' | 'antiguas' | 'no_leidas';

interface NotifItem {
  id: number;
  type: NotifType;
  title: string;
  detail: string;
  time: string;
  timestamp: number; // minutes ago for sorting
  color: string;
  icon: string;
  iconColor: string;
  unread: boolean;
}

const ALL_ITEMS: NotifItem[] = [
  { id: 1, type: 'consulta', title: 'Nueva consulta', detail: 'de María Rodríguez sobre "Casa con jardín"', time: 'Hace 30 minutos', timestamp: 30, color: 'border-primary', icon: 'chat_bubble', iconColor: 'text-primary', unread: true },
  { id: 2, type: 'reserva', title: 'Reserva confirmada', detail: 'para "Salón de eventos" con Carlos Gómez', time: 'Hace 2 horas', timestamp: 120, color: 'border-teal-400', icon: 'calendar_today', iconColor: 'text-teal-500', unread: true },
  { id: 3, type: 'pago', title: 'Pago recibido', detail: 'de $250 por reserva #1234', time: 'Hace 3 horas', timestamp: 180, color: 'border-amber-400', icon: 'payments', iconColor: 'text-amber-500', unread: true },
  { id: 4, type: 'reseña', title: 'Nueva reseña', detail: 'de Laura Martínez para "Terraza con piscina"', time: 'Ayer, 15:45', timestamp: 1200, color: 'border-slate-100 dark:border-slate-800', icon: 'star', iconColor: 'text-amber-500', unread: false },
  { id: 5, type: 'consulta', title: 'Nueva consulta', detail: 'de Javier López sobre "Loft industrial"', time: 'Ayer, 10:20', timestamp: 1500, color: 'border-slate-100 dark:border-slate-800', icon: 'chat_bubble', iconColor: 'text-primary', unread: false },
  { id: 6, type: 'cancelacion', title: 'Cancelación de reserva', detail: 'para "Casa de playa" de Ana Martín', time: 'Ayer, 09:15', timestamp: 1560, color: 'border-slate-100 dark:border-slate-800', icon: 'event_busy', iconColor: 'text-red-500', unread: false },
];

const TABS: { key: TabKey; label: string; types: NotifType[] | null }[] = [
  { key: 'todas', label: 'Todas', types: null },
  { key: 'reservas', label: 'Reservas', types: ['reserva', 'cancelacion'] },
  { key: 'mensajes', label: 'Mensajes', types: ['consulta'] },
  { key: 'pagos', label: 'Pagos', types: ['pago'] },
];

const SORT_OPTIONS: { key: SortKey; label: string }[] = [
  { key: 'recientes', label: 'Recientes' },
  { key: 'antiguas', label: 'Más antiguas' },
  { key: 'no_leidas', label: 'No leídas primero' },
];

const FILTER_OPTIONS: { key: NotifType; label: string }[] = [
  { key: 'consulta', label: 'Consultas' },
  { key: 'reserva', label: 'Reservas' },
  { key: 'pago', label: 'Pagos' },
  { key: 'reseña', label: 'Reseñas' },
  { key: 'cancelacion', label: 'Cancelaciones' },
];

const Notifications: React.FC = () => {
  const navigate = useNavigate();
  const [tab, setTab] = useState<TabKey>('todas');
  const [sort, setSort] = useState<SortKey>('recientes');
  const [activeFilters, setActiveFilters] = useState<Set<NotifType>>(new Set());
  const [showFilterMenu, setShowFilterMenu] = useState(false);
  const [showSortMenu, setShowSortMenu] = useState(false);
  const [readIds, setReadIds] = useState<Set<number>>(new Set());

  const filteredItems = useMemo(() => {
    const tabConfig = TABS.find(t => t.key === tab);
    let items = ALL_ITEMS.filter(item => {
      if (tabConfig?.types && !tabConfig.types.includes(item.type)) return false;
      if (activeFilters.size > 0 && !activeFilters.has(item.type)) return false;
      return true;
    }).map(item => ({ ...item, unread: item.unread && !readIds.has(item.id) }));

    if (sort === 'recientes') items.sort((a, b) => a.timestamp - b.timestamp);
    else if (sort === 'antiguas') items.sort((a, b) => b.timestamp - a.timestamp);
    else if (sort === 'no_leidas') items.sort((a, b) => Number(b.unread) - Number(a.unread) || a.timestamp - b.timestamp);

    return items;
  }, [tab, sort, activeFilters, readIds]);

  // Group by section based on sort (only "Recientes" groups by Hoy/Ayer)
  const grouped = useMemo(() => {
    if (sort !== 'recientes') {
      return [{ title: 'Notificaciones', items: filteredItems }];
    }
    const hoy = filteredItems.filter(i => i.timestamp < 1440);
    const ayer = filteredItems.filter(i => i.timestamp >= 1440);
    return [
      ...(hoy.length ? [{ title: 'Hoy', items: hoy }] : []),
      ...(ayer.length ? [{ title: 'Ayer', items: ayer }] : []),
    ];
  }, [filteredItems, sort]);

  const toggleFilter = (key: NotifType) => {
    setActiveFilters(prev => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  const markRead = (id: number) => {
    setReadIds(prev => new Set(prev).add(id));
  };

  const sortLabel = SORT_OPTIONS.find(s => s.key === sort)?.label || 'Recientes';
  const filterCount = activeFilters.size;

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
          <button
            onClick={() => setReadIds(new Set(ALL_ITEMS.map(i => i.id)))}
            title="Marcar todas como leídas"
            className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full"
          >
            <span className="material-icons-round text-slate-800 dark:text-slate-100">done_all</span>
          </button>
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

      <div className="flex justify-between items-center px-4 py-4 sticky top-[138px] z-20 bg-background-light dark:bg-background-dark/95 backdrop-blur-md">
        <div className="relative">
          <button
            onClick={() => { setShowFilterMenu(v => !v); setShowSortMenu(false); }}
            className={`flex items-center gap-2 bg-white dark:bg-card-dark px-5 py-2.5 rounded-full shadow-sm text-sm font-bold border ${filterCount > 0 ? 'border-primary' : 'border-slate-50 dark:border-slate-800'} group active:scale-95 transition-all`}
          >
            <span className="material-icons-round text-primary text-xl group-hover:scale-110 transition-transform">filter_alt</span>
            <span className="dark:text-white">Filtrar</span>
            {filterCount > 0 && (
              <span className="ml-1 bg-primary text-white text-[10px] font-bold rounded-full w-5 h-5 flex items-center justify-center">{filterCount}</span>
            )}
          </button>
          {showFilterMenu && (
            <div className="absolute left-0 top-full mt-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl shadow-xl p-2 z-30 min-w-[200px]">
              {FILTER_OPTIONS.map(opt => (
                <button
                  key={opt.key}
                  onClick={() => toggleFilter(opt.key)}
                  className={`w-full text-left px-3 py-2 rounded-xl text-sm font-medium transition-colors flex items-center justify-between ${activeFilters.has(opt.key) ? 'bg-primary/10 text-primary' : 'hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200'}`}
                >
                  {opt.label}
                  {activeFilters.has(opt.key) && <span className="material-icons-round text-sm">check</span>}
                </button>
              ))}
              {filterCount > 0 && (
                <button
                  onClick={() => { setActiveFilters(new Set()); setShowFilterMenu(false); }}
                  className="w-full text-center px-3 py-2 mt-1 text-xs font-bold text-primary border-t border-slate-100 dark:border-slate-700"
                >
                  Limpiar filtros
                </button>
              )}
            </div>
          )}
        </div>
        <div className="relative">
          <button
            onClick={() => { setShowSortMenu(v => !v); setShowFilterMenu(false); }}
            className="flex items-center gap-1.5 bg-white dark:bg-card-dark px-5 py-2.5 rounded-full shadow-sm text-sm font-bold border border-slate-50 dark:border-slate-800 group active:scale-95 transition-all"
          >
            <span className="dark:text-white">{sortLabel}</span>
            <span className="material-icons-round text-primary group-hover:translate-y-0.5 transition-transform">expand_more</span>
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

      <main className="px-4 space-y-8 pb-10">
        {grouped.length === 0 && (
          <div className="text-center py-16 text-slate-400">
            <span className="material-icons-round text-5xl mb-2">notifications_off</span>
            <p className="text-sm">No hay notificaciones para mostrar.</p>
          </div>
        )}
        {grouped.map((section, idx) => (
          <section key={idx}>
            <h2 className="text-sm font-bold text-slate-400 dark:text-slate-500 uppercase tracking-[0.15em] mb-4 ml-1">{section.title}</h2>
            <div className="space-y-4">
              {section.items.map((item) => (
                <button
                  key={item.id}
                  onClick={() => markRead(item.id)}
                  className={`w-full text-left bg-white dark:bg-card-dark rounded-2xl shadow-sm overflow-hidden flex border-l-4 ${item.color} transition-all active:scale-[0.99] border dark:border-slate-800`}
                >
                  <div className="p-4 flex gap-5 w-full relative">
                    <div className={`w-12 h-12 rounded-2xl ${item.iconColor.replace('text', 'bg').replace('-500', '-50').replace('-400', '-50')} dark:bg-slate-800/60 flex items-center justify-center shrink-0 shadow-sm`}>
                      <span className={`material-icons-round ${item.iconColor} text-2xl`}>{item.icon}</span>
                    </div>
                    <div className="flex flex-col flex-1 pr-4">
                      <p className="text-[14px] leading-snug dark:text-slate-200">
                        <span className="font-bold text-slate-900 dark:text-white">{item.title}</span> {item.detail}
                      </p>
                      <span className="text-[11px] text-slate-400 font-bold uppercase tracking-wider mt-2">{item.time}</span>
                    </div>
                    {item.unread && (
                      <div className="absolute right-5 top-5 w-2.5 h-2.5 rounded-full bg-primary shadow-[0_0_8px_rgba(242,107,58,0.5)]"></div>
                    )}
                  </div>
                </button>
              ))}
            </div>
          </section>
        ))}
      </main>
    </ProviderLayout>
  );
};

export default Notifications;
