import React, { useEffect, useMemo, useState } from 'react';
import AdminLayout from '../../components/AdminLayout';
import { Skeleton } from '../../components/ui/Skeleton';
import { EmptyState } from '../../components/ui/EmptyState';
import { getFinanceData, COMMISSION_RATES } from '../../src/services/adminService';
import { toast } from 'sonner';

type Period = 'day' | 'week' | 'month' | 'year' | 'all';

const PERIOD_MS: Record<Exclude<Period, 'all'>, number> = {
  day: 24 * 60 * 60 * 1000,
  week: 7 * 24 * 60 * 60 * 1000,
  month: 30 * 24 * 60 * 60 * 1000,
  year: 365 * 24 * 60 * 60 * 1000,
};

const fmt = (n: number) => `$${n.toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

const Finance: React.FC = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [rows, setRows] = useState<any[]>([]);
  const [period, setPeriod] = useState<Period>('month');
  const [category, setCategory] = useState<string>('all');

  useEffect(() => {
    getFinanceData()
      .then(setRows)
      .catch((e) => toast.error(e.message || 'Error cargando finanzas'))
      .finally(() => setIsLoading(false));
  }, []);

  const categories = useMemo(() => {
    const set = new Set<string>();
    rows.forEach((r) => r.venues?.category && set.add(r.venues.category));
    return Array.from(set).sort();
  }, [rows]);

  const filtered = useMemo(() => {
    const now = Date.now();
    return rows.filter((r) => {
      if (category !== 'all' && r.venues?.category !== category) return false;
      if (period === 'all') return true;
      if (!r.event_date) return false;
      return now - new Date(r.event_date).getTime() <= PERIOD_MS[period];
    });
  }, [rows, period, category]);

  const totals = useMemo(() => {
    const gross = filtered.reduce((s, r) => s + Number(r.total_price || 0), 0);
    const platform = gross * COMMISSION_RATES.platform;
    const gateway = gross * COMMISSION_RATES.gateway;
    const hostPayout = gross - platform;
    const netCompany = platform - gateway;
    return { gross, platform, gateway, hostPayout, netCompany, count: filtered.length };
  }, [filtered]);

  const byCategory = useMemo(() => {
    const map = new Map<string, { gross: number; count: number }>();
    filtered.forEach((r) => {
      const cat = r.venues?.category || 'Sin categoría';
      const cur = map.get(cat) || { gross: 0, count: 0 };
      cur.gross += Number(r.total_price || 0);
      cur.count += 1;
      map.set(cat, cur);
    });
    return Array.from(map.entries()).sort((a, b) => b[1].gross - a[1].gross);
  }, [filtered]);

  const cards = [
    { label: 'Ingresos brutos', value: fmt(totals.gross), icon: 'payments', color: 'text-emerald-600 bg-emerald-50 dark:bg-emerald-900/20' },
    { label: `Comisión Lugare (${(COMMISSION_RATES.platform * 100).toFixed(1)}%)`, value: fmt(totals.platform), icon: 'percent', color: 'text-primary bg-orange-50 dark:bg-orange-900/20' },
    { label: `Comisión pasarela (${(COMMISSION_RATES.gateway * 100).toFixed(1)}%)`, value: `-${fmt(totals.gateway)}`, icon: 'credit_card', color: 'text-red-500 bg-red-50 dark:bg-red-900/20' },
    { label: 'Neto empresa', value: fmt(totals.netCompany), icon: 'account_balance', color: 'text-blue-600 bg-blue-50 dark:bg-blue-900/20' },
    { label: 'Pago anfitriones', value: fmt(totals.hostPayout), icon: 'storefront', color: 'text-purple-600 bg-purple-50 dark:bg-purple-900/20' },
    { label: 'Reservas completadas', value: totals.count.toLocaleString(), icon: 'event_available', color: 'text-slate-700 bg-slate-100 dark:bg-slate-800' },
  ];

  return (
    <AdminLayout>
      <header className="mb-6">
        <h1 className="text-4xl font-bold font-display dark:text-white">Finanzas</h1>
        <p className="text-slate-500 mt-2">Ingresos, comisiones y control económico</p>
      </header>

      <div className="flex flex-wrap gap-3 mb-6">
        <select value={period} onChange={(e) => setPeriod(e.target.value as Period)}
          className="px-4 py-2 border border-slate-200 dark:border-slate-700 rounded-xl dark:bg-slate-800 dark:text-white text-sm">
          <option value="day">Hoy</option>
          <option value="week">Esta semana</option>
          <option value="month">Este mes</option>
          <option value="year">Este año</option>
          <option value="all">Todo el tiempo</option>
        </select>
        <select value={category} onChange={(e) => setCategory(e.target.value)}
          className="px-4 py-2 border border-slate-200 dark:border-slate-700 rounded-xl dark:bg-slate-800 dark:text-white text-sm">
          <option value="all">Todos los tipos</option>
          {categories.map((c) => <option key={c} value={c}>{c}</option>)}
        </select>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map((i) => <Skeleton key={i} className="h-32 rounded-2xl" />)}
        </div>
      ) : (
        <>
          <section className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 mb-8">
            {cards.map((c) => (
              <div key={c.label} className="bg-white dark:bg-surface-dark p-6 rounded-3xl shadow-sm border border-slate-100 dark:border-slate-800">
                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center mb-3 ${c.color}`}>
                  <span className="material-icons-round">{c.icon}</span>
                </div>
                <p className="text-xs text-slate-500 font-bold uppercase tracking-widest">{c.label}</p>
                <p className="text-2xl font-bold dark:text-white mt-1">{c.value}</p>
              </div>
            ))}
          </section>

          <section className="bg-white dark:bg-surface-dark rounded-3xl shadow-sm border border-slate-100 dark:border-slate-800 overflow-hidden">
            <div className="p-6 border-b border-slate-100 dark:border-slate-800">
              <h3 className="text-xl font-bold dark:text-white">Desglose por tipo de espacio</h3>
            </div>
            {byCategory.length === 0 ? (
              <div className="p-6">
                <EmptyState title="Sin ingresos" description="No hay reservas completadas en este periodo." icon="payments" />
              </div>
            ) : (
              <table className="w-full text-left">
                <thead className="bg-slate-50 dark:bg-slate-800 text-slate-500 text-xs uppercase tracking-widest">
                  <tr>
                    <th className="p-4">Tipo</th>
                    <th className="p-4 text-right">Reservas</th>
                    <th className="p-4 text-right">Ingresos</th>
                    <th className="p-4 text-right">Comisión Lugare</th>
                    <th className="p-4 text-right">% del total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {byCategory.map(([cat, data]) => (
                    <tr key={cat} className="text-sm dark:text-slate-300">
                      <td className="p-4 font-medium capitalize">{cat}</td>
                      <td className="p-4 text-right">{data.count}</td>
                      <td className="p-4 text-right font-bold">{fmt(data.gross)}</td>
                      <td className="p-4 text-right text-primary">{fmt(data.gross * COMMISSION_RATES.platform)}</td>
                      <td className="p-4 text-right text-slate-500">
                        {totals.gross > 0 ? `${((data.gross / totals.gross) * 100).toFixed(1)}%` : '0%'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </section>

          <p className="text-xs text-slate-400 mt-4">
            Tasas configurables en <code>src/services/adminService.ts</code> (COMMISSION_RATES).
          </p>
        </>
      )}
    </AdminLayout>
  );
};

export default Finance;
