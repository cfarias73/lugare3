import React, { useEffect, useMemo, useState } from 'react';
import AdminLayout from '../../components/AdminLayout';
import { Skeleton } from '../../components/ui/Skeleton';
import { EmptyState } from '../../components/ui/EmptyState';
import { getPayouts, markPayoutPaid } from '../../src/services/adminService';
import { toast } from 'sonner';
import { supabase } from '../../lib/supabaseClient';
import {
  DEFAULT_SETTINGS,
  PlatformSettings,
  computeCommissions,
  loadPlatformSettings,
  fmtMXN,
} from '../../src/utils/commissions';
import { formatLocalDate } from '../../src/utils/date';

type Filter = 'pending' | 'paid' | 'all';

const Payouts: React.FC = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [rows, setRows] = useState<any[]>([]);
  const [settings, setSettings] = useState<PlatformSettings>({ ...DEFAULT_SETTINGS });
  const [filter, setFilter] = useState<Filter>('pending');
  const [saving, setSaving] = useState<string | null>(null);

  const load = () => {
    setIsLoading(true);
    Promise.all([getPayouts(), loadPlatformSettings(supabase)])
      .then(([r, s]) => { setRows(r); setSettings(s); })
      .catch((e) => toast.error(e.message || 'Error cargando pagos'))
      .finally(() => setIsLoading(false));
  };

  useEffect(load, []);

  // Deriva el precio base a partir de lo que pagó el usuario (mismo criterio que Finanzas)
  const baseFromPaid = (paid: number, s: PlatformSettings) => {
    const factor = (1 + s.vat_percent / 100) + (s.user_commission_percent / 100) * (1 + s.vat_percent / 100);
    return factor > 0 ? Math.max(0, paid / factor) : 0;
  };

  const items = useMemo(() => {
    return rows
      .map((r) => {
        const paid = Number(r.total_price || 0);
        const b = computeCommissions(baseFromPaid(paid, settings), settings);
        return { ...r, payout: b.hostPayout, withheld: b.taxesWithheldTotal, paid };
      })
      .filter((r) => (filter === 'all' ? true : filter === 'paid' ? !!r.host_paid_at : !r.host_paid_at));
  }, [rows, settings, filter]);

  const totalPending = useMemo(
    () => items.filter((i) => !i.host_paid_at).reduce((a, i) => a + i.payout, 0),
    [items]
  );

  const handlePay = async (id: string) => {
    setSaving(id);
    try {
      await markPayoutPaid(id);
      toast.success('Marcado como pagado');
      setRows((prev) => prev.map((r) => (r.id === id ? { ...r, host_paid_at: new Date().toISOString() } : r)));
    } catch (e: any) {
      toast.error(e.message || 'No se pudo marcar como pagado');
    } finally {
      setSaving(null);
    }
  };

  return (
    <AdminLayout>
      <header className="mb-6">
        <h1 className="text-4xl font-bold font-display dark:text-white">Pagos a anfitriones</h1>
        <p className="text-slate-500 mt-2">
          Cuánto se le debe a cada anfitrión, a qué CLABE y cuándo se pagó.
        </p>
      </header>

      <div className="flex flex-wrap items-center gap-3 mb-6">
        <select
          value={filter}
          onChange={(e) => setFilter(e.target.value as Filter)}
          className="px-4 py-2 border border-slate-200 dark:border-slate-700 rounded-xl dark:bg-slate-800 dark:text-white text-sm"
        >
          <option value="pending">Pendientes de pago</option>
          <option value="paid">Ya pagados</option>
          <option value="all">Todos</option>
        </select>
        <div className="px-4 py-2 rounded-xl bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 text-sm font-bold">
          Por pagar: {fmtMXN(totalPending)}
        </div>
      </div>

      {isLoading ? (
        <Skeleton className="h-64 rounded-3xl" />
      ) : items.length === 0 ? (
        <EmptyState title="Sin pagos" description="No hay reservas en este estado." icon="account_balance" />
      ) : (
        <section className="bg-white dark:bg-surface-dark rounded-3xl shadow-sm border border-slate-100 dark:border-slate-800 overflow-x-auto">
          <table className="w-full text-left min-w-[900px]">
            <thead className="bg-slate-50 dark:bg-slate-800 text-slate-500 text-xs uppercase tracking-widest">
              <tr>
                <th className="p-4">Fecha evento</th>
                <th className="p-4">Espacio</th>
                <th className="p-4">Anfitrión</th>
                <th className="p-4">Banco / CLABE</th>
                <th className="p-4 text-right">Retenciones</th>
                <th className="p-4 text-right">Neto a pagar</th>
                <th className="p-4 text-right">Estado</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {items.map((r) => (
                <tr key={r.id} className="text-sm dark:text-slate-300">
                  <td className="p-4 whitespace-nowrap">
                    {r.event_date ? formatLocalDate(r.event_date, undefined, 'es-MX') : '—'}
                  </td>
                  <td className="p-4 font-medium">{r.venue_name || '—'}</td>
                  <td className="p-4">
                    <p className="font-medium">{r.host?.name || 'Sin nombre'}</p>
                    <p className="text-xs text-slate-400">{r.host?.email || ''}</p>
                  </td>
                  <td className="p-4">
                    {r.host?.clabe ? (
                      <>
                        <p className="font-mono text-xs">{r.host.clabe}</p>
                        <p className="text-xs text-slate-400">
                          {r.host.bank_name || 'Banco no indicado'} · {r.host.account_holder || 'Titular no indicado'}
                        </p>
                      </>
                    ) : (
                      <span className="text-xs text-red-500 font-bold">CLABE no registrada</span>
                    )}
                  </td>
                  <td className="p-4 text-right text-amber-600">{fmtMXN(r.withheld)}</td>
                  <td className="p-4 text-right font-bold">{fmtMXN(r.payout)}</td>
                  <td className="p-4 text-right">
                    {r.host_paid_at ? (
                      <span className="text-xs text-emerald-600 font-bold">
                        Pagado {new Date(r.host_paid_at).toLocaleDateString('es-MX')}
                      </span>
                    ) : (
                      <button
                        onClick={() => handlePay(r.id)}
                        disabled={saving === r.id}
                        className="px-3 py-2 rounded-xl bg-primary text-white text-xs font-bold disabled:opacity-50"
                      >
                        {saving === r.id ? '...' : 'Marcar pagado'}
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      )}

      <p className="text-xs text-slate-400 mt-4">
        El neto se calcula con las tasas actuales de <a href="#/admin/settings" className="underline">Configuración</a>.
        La CLABE la captura cada anfitrión en su perfil.
      </p>
    </AdminLayout>
  );
};

export default Payouts;
