
import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import ProviderLayout from '../../components/ProviderLayout';
import { Skeleton } from '../../components/ui/Skeleton';
import { EmptyState } from '../../components/ui/EmptyState';
import { useUser } from '../../context/UserContext';
import { getProviderDashboard, DashboardPeriod } from '../../src/services/providerService';
import { getProfile } from '../../src/services/profileService';

const PERIOD_LABEL: Record<DashboardPeriod, string> = {
  hoy: 'HOY',
  esta_semana: 'ESTA SEMANA',
  este_mes: 'ESTE MES',
};

interface DashboardData {
  reservas: number;
  reservasTrend: string;
  ingresos: number;
  ingresosTrend: string;
  chartData: number[];
  chartLabels: string[];
  upcoming: any[];
}

const formatMoney = (n: number) => `$${n.toLocaleString('es-MX')}`;

const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useUser();
  const [currentPeriod, setCurrentPeriod] = useState<DashboardPeriod>('este_mes');
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<DashboardData | null>(null);
  const [hostName, setHostName] = useState<string>('');
  const [hostAvatar, setHostAvatar] = useState<string | null>(null);
  const filterRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!user?.id) return;
    getProfile(user.id).then(p => {
      if (p) {
        setHostName((p.name || '').split(' ')[0] || 'Anfitrión');
        setHostAvatar(p.avatar_url);
      }
    }).catch(() => {});
  }, [user?.id]);

  useEffect(() => {
    if (!user?.id) return;
    setLoading(true);
    getProviderDashboard(user.id, currentPeriod)
      .then(setData)
      .catch(e => { console.error(e); })
      .finally(() => setLoading(false));
  }, [user?.id, currentPeriod]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (filterRef.current && !filterRef.current.contains(event.target as Node)) {
        setIsFilterOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const chartMax = data ? Math.max(1, ...data.chartData) : 1;
  const totalIngresos = data?.ingresos ?? 0;
  const upcomingTotal = data?.upcoming.reduce((s, b) => s + (Number(b.total_price) || 0), 0) ?? 0;
  const avgIngresos = data && data.chartData.length > 0
    ? data.chartData.reduce((s, n) => s + n, 0) / data.chartData.filter(n => n > 0).length || 0
    : 0;

  return (
    <ProviderLayout>
      <header className="px-6 pt-[calc(env(safe-area-inset-top,0px)+1rem)] pb-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-14 h-14 bg-primary rounded-[20px] flex items-center justify-center text-white shadow-lg shadow-primary/20 overflow-hidden">
            {hostAvatar ? (
              <img src={hostAvatar} className="w-full h-full object-cover" alt={hostName} loading="lazy" />
            ) : (
              <span className="material-icons-round text-2xl">person</span>
            )}
          </div>
          <div>
            <h1 className="text-xl font-bold leading-tight dark:text-white font-display uppercase tracking-tight">
              ¡Hola, {hostName || '...'}!
            </h1>
            <p className="text-sm text-slate-500 font-medium">Propietario</p>
          </div>
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => navigate('/provider/notifications')}
            className="w-11 h-11 flex items-center justify-center rounded-2xl bg-white dark:bg-surface-dark shadow-sm border border-slate-100 dark:border-slate-800 text-slate-600 dark:text-slate-300 transition-colors"
          >
            <span className="material-icons-round">notifications_none</span>
          </button>
          <button
            onClick={() => navigate('/provider/profile')}
            className="w-11 h-11 flex items-center justify-center rounded-2xl bg-white dark:bg-surface-dark shadow-sm border border-slate-100 dark:border-slate-800 text-slate-600 dark:text-slate-300 transition-colors"
          >
            <span className="material-icons-round">account_circle</span>
          </button>
        </div>
      </header>

      <div className="px-5 space-y-8">
        <section>
          <div className="flex items-center justify-between mb-5 px-1 relative">
            <h2 className="text-lg font-bold dark:text-white font-display uppercase tracking-tight">Resumen</h2>
            <div ref={filterRef} className="relative">
              <button
                onClick={() => setIsFilterOpen(!isFilterOpen)}
                className="text-xs font-bold text-secondary flex items-center gap-1 uppercase tracking-wider transition-all active:scale-95 py-2"
              >
                {PERIOD_LABEL[currentPeriod]} <span className="material-icons-round text-sm transition-transform duration-300" style={{ transform: isFilterOpen ? 'rotate(180deg)' : 'rotate(0)' }}>expand_more</span>
              </button>

              {isFilterOpen && (
                <div className="absolute right-0 top-10 w-44 bg-white dark:bg-slate-800 rounded-2xl shadow-2xl border border-slate-100 dark:border-slate-700 z-[100] py-2 animate-in fade-in slide-in-from-top-2 duration-300">
                  {(Object.keys(PERIOD_LABEL) as DashboardPeriod[]).map((p) => (
                    <button
                      key={p}
                      onClick={() => {
                        setCurrentPeriod(p);
                        setIsFilterOpen(false);
                      }}
                      className={`w-full px-5 py-3 text-left text-xs font-bold transition-colors uppercase tracking-widest ${currentPeriod === p ? 'text-primary bg-primary/5' : 'text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700/50'}`}
                    >
                      {PERIOD_LABEL[p]}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
          {loading || !data ? (
            <div className="grid grid-cols-2 gap-4">
              <Skeleton className="h-32 rounded-[32px]" />
              <Skeleton className="h-32 rounded-[32px]" />
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-4">
              <div
                onClick={() => navigate('/provider/received-bookings')}
                className="bg-white dark:bg-surface-dark p-6 rounded-[32px] shadow-sm border border-slate-100 dark:border-slate-800 relative overflow-hidden group cursor-pointer active:scale-[0.98] transition-all"
              >
                <div className="flex justify-between items-start mb-4">
                  <div className="w-10 h-10 rounded-2xl bg-orange-50 dark:bg-orange-900/20 flex items-center justify-center text-primary group-hover:scale-110 transition-transform">
                    <span className="material-icons-round">calendar_today</span>
                  </div>
                  <span className={`text-[10px] font-bold px-2 py-1 rounded-full ${data.reservasTrend.startsWith('+') ? 'text-emerald-500 bg-emerald-50 dark:bg-emerald-950/20' : data.reservasTrend.startsWith('-') ? 'text-rose-500 bg-rose-50 dark:bg-rose-950/20' : 'text-slate-500 bg-slate-100 dark:bg-slate-800'}`}>
                    {data.reservasTrend}
                  </span>
                </div>
                <p className="text-slate-400 text-[11px] font-bold uppercase tracking-wider mb-1">Reservas</p>
                <p className="text-3xl font-bold dark:text-white transition-all duration-500 tabular-nums">{data.reservas}</p>
              </div>
              <div
                onClick={() => navigate('/provider/stats')}
                className="bg-white dark:bg-surface-dark p-6 rounded-[32px] shadow-sm border border-slate-100 dark:border-slate-800 relative overflow-hidden group cursor-pointer active:scale-[0.98] transition-all"
              >
                <div className="flex justify-between items-start mb-4">
                  <div className="w-10 h-10 rounded-2xl bg-cyan-50 dark:bg-cyan-900/20 flex items-center justify-center text-secondary group-hover:scale-110 transition-transform">
                    <span className="material-icons-round">payments</span>
                  </div>
                  <span className={`text-[10px] font-bold px-2 py-1 rounded-full ${data.ingresosTrend.startsWith('+') ? 'text-emerald-500 bg-emerald-50 dark:bg-emerald-950/20' : data.ingresosTrend.startsWith('-') ? 'text-rose-500 bg-rose-50 dark:bg-rose-950/20' : 'text-slate-500 bg-slate-100 dark:bg-slate-800'}`}>
                    {data.ingresosTrend}
                  </span>
                </div>
                <p className="text-slate-400 text-[11px] font-bold uppercase tracking-wider mb-1">Ingresos</p>
                <p className="text-2xl font-bold dark:text-white transition-all duration-500 tabular-nums">{formatMoney(data.ingresos)}</p>
              </div>
            </div>
          )}
        </section>

        <section className="bg-white dark:bg-surface-dark p-7 rounded-[40px] shadow-sm border border-slate-100 dark:border-slate-800">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-lg font-bold dark:text-white font-display uppercase tracking-tight">Ingresos</h2>
            <button onClick={() => navigate('/provider/stats')} className="text-xs font-bold text-secondary uppercase tracking-widest">Ver todo</button>
          </div>
          <div className="h-44 w-full relative mb-10">
            {loading || !data ? (
              <Skeleton className="h-full w-full rounded-2xl" />
            ) : (
              <>
                <div className="absolute inset-0 flex items-end justify-between px-2 gap-1">
                  {data.chartData.map((v, i) => {
                    const pct = (v / chartMax) * 100;
                    return (
                      <div key={i} className="flex-1 bg-primary/10 rounded-t-lg relative group h-full">
                        <div className="absolute bottom-0 inset-x-0 bg-primary rounded-t-lg transition-all duration-1000" style={{ height: `${pct}%` }} />
                      </div>
                    );
                  })}
                </div>
                <div className="absolute bottom-[-30px] inset-x-0 flex justify-between text-[10px] text-slate-400 font-bold uppercase tracking-widest px-1">
                  {data.chartLabels.map((label, i) => (
                    <span key={i} className="flex-1 text-center">{label}</span>
                  ))}
                </div>
              </>
            )}
          </div>
          <div className="grid grid-cols-3 gap-2 border-t dark:border-slate-800 pt-8 mt-6">
            <div className="text-center">
              <p className="text-[10px] text-slate-400 uppercase font-bold tracking-widest mb-1.5">Periodo</p>
              <p className="text-sm font-bold text-primary font-display">{formatMoney(totalIngresos)}</p>
            </div>
            <div className="text-center border-x dark:border-slate-800">
              <p className="text-[10px] text-slate-400 uppercase font-bold tracking-widest mb-1.5">Próximas</p>
              <p className="text-sm font-bold text-secondary font-display">{formatMoney(upcomingTotal)}</p>
            </div>
            <div className="text-center">
              <p className="text-[10px] text-slate-400 uppercase font-bold tracking-widest mb-1.5">Promedio</p>
              <p className="text-sm font-bold dark:text-white font-display">{formatMoney(Math.round(avgIngresos))}</p>
            </div>
          </div>
        </section>

        <section className="pb-8">
          <div className="flex items-center justify-between mb-6 px-1">
            <h2 className="text-lg font-bold dark:text-white font-display uppercase tracking-tight">Próximas reservas</h2>
            <button onClick={() => navigate('/provider/received-bookings')} className="text-xs font-bold text-secondary uppercase tracking-widest">Ver todas</button>
          </div>
          {loading || !data ? (
            <div className="space-y-4">
              <Skeleton className="h-32 rounded-[36px]" />
              <Skeleton className="h-32 rounded-[36px]" />
            </div>
          ) : data.upcoming.length === 0 ? (
            <EmptyState
              icon="event_busy"
              title="Sin reservas próximas"
              description="Aún no tienes reservas confirmadas en el horizonte."
              action={{ label: 'Ver calendario', onClick: () => navigate('/provider/calendar') }}
            />
          ) : (
            <div className="space-y-4">
              {data.upcoming.map((booking) => (
                <div key={booking.id} onClick={() => navigate('/provider/received-bookings')} className="bg-white dark:bg-surface-dark p-6 rounded-[36px] shadow-sm border border-slate-100 dark:border-slate-800 group active:scale-[0.99] transition-all cursor-pointer">
                  <div className="flex justify-between items-start mb-6">
                    <div className="flex gap-4">
                      <div className="w-14 h-14 bg-orange-50 dark:bg-orange-900/20 rounded-2xl flex items-center justify-center text-primary">
                        <span className="material-icons-round text-3xl">event</span>
                      </div>
                      <div>
                        <h3 className="font-bold text-lg dark:text-white tracking-tight uppercase truncate max-w-[180px]">{booking.venues?.name || 'Espacio'}</h3>
                        <p className="text-xs text-slate-400 font-bold uppercase tracking-wider">{booking.event_date}</p>
                      </div>
                    </div>
                    <span className="bg-emerald-100 dark:bg-emerald-900/40 text-emerald-600 text-[10px] font-bold px-4 py-2 rounded-xl uppercase tracking-widest">
                      Confirmada
                    </span>
                  </div>
                  <div className="grid grid-cols-3 gap-6 border-t dark:border-slate-800 pt-6">
                    <div>
                      <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mb-2">Cliente</p>
                      <div className="flex items-center gap-2">
                        {booking.profiles?.avatar_url ? (
                          <img src={booking.profiles.avatar_url} className="w-6 h-6 rounded-full object-cover" alt="" loading="lazy" />
                        ) : (
                          <div className="w-6 h-6 rounded-full bg-slate-200 dark:bg-slate-700" />
                        )}
                        <span className="text-[11px] font-bold dark:text-slate-200 truncate">{booking.profiles?.name || 'Invitado'}</span>
                      </div>
                    </div>
                    <div>
                      <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mb-2">Horario</p>
                      <p className="text-[11px] font-bold dark:text-slate-200">{booking.start_time?.slice(0,5)}–{booking.end_time?.slice(0,5)}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mb-2">Valor</p>
                      <p className="text-[11px] font-bold text-primary">{formatMoney(Number(booking.total_price) || 0)}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </ProviderLayout>
  );
};

export default Dashboard;
