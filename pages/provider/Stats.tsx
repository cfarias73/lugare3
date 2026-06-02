import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import ProviderLayout from '../../components/ProviderLayout';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { useUser } from '../../context/UserContext';
import { getProviderStats, ProviderStats } from '../../src/services/providerService';
import { Skeleton } from '../../components/ui/Skeleton';
import { EmptyState } from '../../components/ui/EmptyState';

const fmtMoney = (n: number) => `$${n.toLocaleString('es-MX', { maximumFractionDigits: 0 })}`;
const isPositive = (s: string) => !s.startsWith('-') && s !== '0%';

const TrendBadge: React.FC<{ value: string }> = ({ value }) => {
  const pos = isPositive(value);
  return (
    <span className={`text-[10px] font-bold flex items-center px-1.5 py-0.5 rounded-lg ${pos ? 'text-emerald-500 bg-emerald-50 dark:bg-emerald-950/30' : 'text-rose-500 bg-rose-50 dark:bg-rose-950/30'}`}>
      <span className="material-icons-round text-[12px] mr-0.5">{pos ? 'arrow_upward' : 'arrow_downward'}</span>
      {value.replace('-', '')}
    </span>
  );
};

const Stats: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useUser();
  const [refDate, setRefDate] = useState(() => new Date());
  const [stats, setStats] = useState<ProviderStats | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      const s = await getProviderStats(user.id, refDate);
      setStats(s);
    } finally {
      setLoading(false);
    }
  }, [user, refDate]);

  useEffect(() => { load(); }, [load]);

  const shiftMonth = (delta: number) => {
    setRefDate(d => new Date(d.getFullYear(), d.getMonth() + delta, 1));
  };

  return (
    <ProviderLayout>
      <header className="sticky top-0 z-50 bg-white dark:bg-card-dark px-4 pt-10 pb-3 flex items-center justify-between shadow-sm transition-colors">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate(-1)} className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full">
            <span className="material-icons-round text-slate-700 dark:text-slate-300">arrow_back</span>
          </button>
          <h1 className="text-xl font-bold dark:text-white font-display tracking-tight">Estadísticas</h1>
        </div>
      </header>

      <main className="p-4 space-y-6 pb-12">
        {/* Month Selector */}
        <div className="bg-white dark:bg-slate-800 p-4 rounded-2xl flex items-center justify-between shadow-sm border border-slate-50 dark:border-slate-700">
          <button onClick={() => shiftMonth(-1)} className="p-1.5 rounded-full text-secondary hover:bg-secondary/10 transition-colors">
            <span className="material-icons-round">chevron_left</span>
          </button>
          <div className="text-center">
            <p className="font-bold text-slate-800 dark:text-white tracking-tight capitalize">{stats?.monthLabel || '—'}</p>
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-0.5">
              Comparado con <span className="text-secondary capitalize">{stats?.prevMonthLabel || '—'}</span>
            </p>
          </div>
          <button onClick={() => shiftMonth(1)} className="p-1.5 rounded-full text-secondary hover:bg-secondary/10 transition-colors">
            <span className="material-icons-round">chevron_right</span>
          </button>
        </div>

        {loading || !stats ? (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <Skeleton className="h-24 rounded-3xl" />
              <Skeleton className="h-24 rounded-3xl" />
            </div>
            <Skeleton className="h-60 rounded-[36px]" />
            <Skeleton className="h-40 rounded-[36px]" />
          </div>
        ) : (
          <>
            {/* Reservas */}
            <section>
              <h2 className="text-sm font-bold mb-3 text-slate-700 dark:text-slate-300 uppercase tracking-[0.1em]">Reservas mensuales</h2>
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-white dark:bg-slate-800 p-5 rounded-3xl shadow-sm border border-slate-50 dark:border-slate-700">
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mb-1">Total reservas</p>
                  <div className="flex items-baseline gap-2">
                    <span className="text-3xl font-bold dark:text-white">{stats.totalReservas}</span>
                    <TrendBadge value={stats.totalReservasTrend} />
                  </div>
                </div>
                <div className="bg-white dark:bg-slate-800 p-5 rounded-3xl shadow-sm border border-slate-50 dark:border-slate-700">
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mb-1">Confirmadas</p>
                  <div className="flex items-baseline gap-2">
                    <span className="text-3xl font-bold dark:text-white">{stats.completadas}</span>
                    <TrendBadge value={stats.completadasTrend} />
                  </div>
                </div>
              </div>
            </section>

            {/* Trend */}
            <section className="bg-white dark:bg-slate-800 p-6 rounded-[36px] shadow-sm border border-slate-50 dark:border-slate-700">
              <h3 className="text-sm font-bold dark:text-white tracking-tight mb-4">Tendencia de reservas (últimos 6 meses)</h3>
              <div className="h-44 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={stats.trend}>
                    <XAxis dataKey="name" tick={{ fontSize: 11 }} stroke="#94a3b8" />
                    <YAxis hide />
                    <Tooltip />
                    <Line type="monotone" dataKey="value" stroke="#F26B3A" strokeWidth={3} dot={{ r: 4 }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </section>

            {/* Top Venues */}
            <section className="bg-white dark:bg-slate-800 p-6 rounded-[36px] shadow-sm border border-slate-50 dark:border-slate-700">
              <h3 className="text-sm font-bold mb-6 dark:text-white tracking-tight">Espacios más reservados</h3>
              {stats.topVenues.length === 0 ? (
                <p className="text-sm text-slate-400 text-center py-4">Sin reservas este mes.</p>
              ) : (
                <div className="space-y-6">
                  {stats.topVenues.map((v) => {
                    const color = v.rank === 1 ? 'bg-primary' : v.rank === 2 ? 'bg-secondary' : 'bg-amber-400';
                    return (
                      <div key={v.rank} className="flex items-center justify-between">
                        <div className="flex items-center gap-4 min-w-0">
                          <div className={`w-11 h-11 ${color} text-white flex items-center justify-center rounded-[18px] font-bold text-lg shadow-sm flex-shrink-0`}>{v.rank}</div>
                          <div className="min-w-0">
                            <p className="text-[15px] font-bold dark:text-white tracking-tight leading-tight truncate">{v.name}</p>
                            <p className="text-[11px] text-slate-400 font-medium">{v.count} reserva{v.count === 1 ? '' : 's'}</p>
                          </div>
                        </div>
                        <TrendBadge value={v.trend} />
                      </div>
                    );
                  })}
                </div>
              )}
            </section>

            {/* Finance */}
            <section>
              <h2 className="text-sm font-bold mb-3 text-slate-700 dark:text-slate-300 uppercase tracking-[0.1em]">Ingresos y visitas</h2>
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-white dark:bg-slate-800 p-5 rounded-3xl shadow-sm border border-slate-50 dark:border-slate-700">
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mb-1">Ingresos totales</p>
                  <div className="flex items-baseline gap-2">
                    <span className="text-2xl font-bold dark:text-white">{fmtMoney(stats.ingresos)}</span>
                    <TrendBadge value={stats.ingresosTrend} />
                  </div>
                </div>
                <div className="bg-white dark:bg-slate-800 p-5 rounded-3xl shadow-sm border border-slate-50 dark:border-slate-700">
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mb-1">Visitas a espacios</p>
                  <div className="flex items-baseline gap-2">
                    <span className="text-2xl font-bold dark:text-white">{stats.visitas}</span>
                    <TrendBadge value={stats.visitasTrend} />
                  </div>
                </div>
              </div>
            </section>

            {stats.totalReservas === 0 && (
              <EmptyState
                icon="insights"
                title="Sin actividad este mes"
                description="Cuando recibas reservas verás aquí tus métricas."
              />
            )}
          </>
        )}
      </main>
    </ProviderLayout>
  );
};

export default Stats;
