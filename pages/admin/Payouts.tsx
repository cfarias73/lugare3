import React, { useEffect, useMemo, useState } from 'react';
import * as XLSX from 'xlsx';
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

const getMonthKey = (eventDate?: string | null): string | null => {
  if (!eventDate || eventDate.length < 7) return null;
  return eventDate.slice(0, 7); // YYYY-MM
};

const formatMonthLabel = (monthKey: string): string => {
  const [year, month] = monthKey.split('-').map(Number);
  if (!year || !month) return monthKey;
  const label = new Date(year, month - 1, 1).toLocaleDateString('es-MX', {
    month: 'long',
    year: 'numeric',
  });
  return label.charAt(0).toUpperCase() + label.slice(1);
};

const Payouts: React.FC = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [rows, setRows] = useState<any[]>([]);
  const [settings, setSettings] = useState<PlatformSettings>({ ...DEFAULT_SETTINGS });
  const [filter, setFilter] = useState<Filter>('all');
  const [selectedMonth, setSelectedMonth] = useState<string>('all');
  const [selectedHostId, setSelectedHostId] = useState<string>('all');
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

  const monthOptions = useMemo(() => {
    const keys = new Set<string>();
    rows.forEach((r) => {
      const key = getMonthKey(r.event_date);
      if (key) keys.add(key);
    });
    return Array.from(keys)
      .sort((a, b) => b.localeCompare(a))
      .map((key) => ({ value: key, label: formatMonthLabel(key) }));
  }, [rows]);

  const hostOptions = useMemo(() => {
    const map = new Map<string, { id: string; name: string; email?: string }>();
    rows.forEach((r) => {
      if (r.host?.id && !map.has(r.host.id)) {
        map.set(r.host.id, {
          id: r.host.id,
          name: r.host.name || 'Sin nombre',
          email: r.host.email,
        });
      }
    });
    return Array.from(map.values()).sort((a, b) => a.name.localeCompare(b.name, 'es-MX'));
  }, [rows]);

  const items = useMemo(() => {
    return rows
      .map((r) => {
        const paid = Number(r.total_price || 0);
        const b = computeCommissions(baseFromPaid(paid, settings), settings);
        return {
          ...r,
          breakdown: b,
          payout: b.hostPayout,
          withheld: b.taxesWithheldTotal,
          paid,
        };
      })
      .filter((r) => {
        if (filter === 'paid' && !r.host_paid_at) return false;
        if (filter === 'pending' && r.host_paid_at) return false;
        if (selectedMonth !== 'all' && getMonthKey(r.event_date) !== selectedMonth) return false;
        if (selectedHostId !== 'all' && r.host?.id !== selectedHostId) return false;
        return true;
      });
  }, [rows, settings, filter, selectedMonth, selectedHostId]);

  const totals = useMemo(() => {
    return items.reduce(
      (acc, i) => {
        acc.withheld += i.withheld;
        acc.vatWithheld += i.breakdown.vatWithheld;
        acc.isrWithheld += i.breakdown.isrWithheld;
        acc.otherWithheld += i.breakdown.otherWithheld;
        acc.payout += i.payout;
        if (!i.host_paid_at) acc.pendingPayout += i.payout;
        return acc;
      },
      {
        withheld: 0,
        vatWithheld: 0,
        isrWithheld: 0,
        otherWithheld: 0,
        payout: 0,
        pendingPayout: 0,
      }
    );
  }, [items]);

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

  const handleExportExcel = () => {
    if (items.length === 0) return;

    const exportRows = items.map((r) => ({
      'Fecha evento': r.event_date ? formatLocalDate(r.event_date, undefined, 'es-MX') : '',
      'ID Reserva': r.id,
      Espacio: r.venue_name || '',
      Anfitrión: r.host?.name || 'Sin nombre',
      Email: r.host?.email || '',
      Banco: r.host?.bank_name || '',
      CLABE: r.host?.clabe || '',
      Titular: r.host?.account_holder || '',
      'Pagado por usuario': Number(r.paid.toFixed(2)),
      'Precio base': Number(r.breakdown.basePrice.toFixed(2)),
      'IVA base': Number(r.breakdown.vatOnBase.toFixed(2)),
      'Comisión anfitrión': Number(r.breakdown.hostCommission.toFixed(2)),
      'IVA retenido': Number(r.breakdown.vatWithheld.toFixed(2)),
      'ISR retenido': Number(r.breakdown.isrWithheld.toFixed(2)),
      'Otras retenciones': Number(r.breakdown.otherWithheld.toFixed(2)),
      'Total retenciones': Number(r.withheld.toFixed(2)),
      'Neto anfitrión': Number(r.payout.toFixed(2)),
      Estado: r.host_paid_at ? 'Pagado' : 'Pendiente',
      'Fecha de pago': r.host_paid_at ? new Date(r.host_paid_at).toLocaleDateString('es-MX') : '',
    }));

    exportRows.push({
      'Fecha evento': 'TOTAL',
      'ID Reserva': `${items.length} reservas`,
      Espacio: '',
      Anfitrión: '',
      Email: '',
      Banco: '',
      CLABE: '',
      Titular: '',
      'Pagado por usuario': Number(items.reduce((s, r) => s + r.paid, 0).toFixed(2)),
      'Precio base': Number(items.reduce((s, r) => s + r.breakdown.basePrice, 0).toFixed(2)),
      'IVA base': Number(items.reduce((s, r) => s + r.breakdown.vatOnBase, 0).toFixed(2)),
      'Comisión anfitrión': Number(items.reduce((s, r) => s + r.breakdown.hostCommission, 0).toFixed(2)),
      'IVA retenido': Number(totals.vatWithheld.toFixed(2)),
      'ISR retenido': Number(totals.isrWithheld.toFixed(2)),
      'Otras retenciones': Number(totals.otherWithheld.toFixed(2)),
      'Total retenciones': Number(totals.withheld.toFixed(2)),
      'Neto anfitrión': Number(totals.payout.toFixed(2)),
      Estado: '',
      'Fecha de pago': '',
    });

    const worksheet = XLSX.utils.json_to_sheet(exportRows);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Retenciones');

    const hostSlug =
      selectedHostId !== 'all'
        ? (hostOptions.find((h) => h.id === selectedHostId)?.name || 'anfitrion')
            .toLowerCase()
            .replace(/[^a-z0-9]+/gi, '-')
            .replace(/(^-|-$)/g, '')
        : 'todos';
    const monthSlug = selectedMonth !== 'all' ? selectedMonth : 'todos-los-meses';
    XLSX.writeFile(workbook, `retenciones-${monthSlug}-${hostSlug}.xlsx`);
  };

  const hasActiveFilters = filter !== 'all' || selectedMonth !== 'all' || selectedHostId !== 'all';

  return (
    <AdminLayout>
      <header className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-4xl font-bold font-display dark:text-white">Pagos y retenciones</h1>
          <p className="text-slate-500 mt-2">
            Filtra por mes y anfitrión para revisar reservas, retenciones mensuales y neto a pagar.
          </p>
        </div>
        <button
          onClick={handleExportExcel}
          disabled={isLoading || items.length === 0}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 text-white text-sm font-bold hover:bg-emerald-700 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
        >
          <span className="material-icons-round text-base">download</span>
          Exportar Excel
        </button>
      </header>

      <div className="flex flex-wrap items-center gap-3 mb-6">
        <select
          aria-label="Filtrar por mes"
          value={selectedMonth}
          onChange={(e) => setSelectedMonth(e.target.value)}
          className="px-4 py-2 border border-slate-200 dark:border-slate-700 rounded-xl dark:bg-slate-800 dark:text-white text-sm"
        >
          <option value="all">Todos los meses</option>
          {monthOptions.map((m) => (
            <option key={m.value} value={m.value}>
              {m.label}
            </option>
          ))}
        </select>

        <select
          aria-label="Filtrar por anfitrión"
          value={selectedHostId}
          onChange={(e) => setSelectedHostId(e.target.value)}
          className="px-4 py-2 border border-slate-200 dark:border-slate-700 rounded-xl dark:bg-slate-800 dark:text-white text-sm max-w-[260px]"
        >
          <option value="all">Todos los anfitriones</option>
          {hostOptions.map((h) => (
            <option key={h.id} value={h.id}>
              {h.name}{h.email ? ` (${h.email})` : ''}
            </option>
          ))}
        </select>

        <select
          aria-label="Filtrar por estado de pago"
          value={filter}
          onChange={(e) => setFilter(e.target.value as Filter)}
          className="px-4 py-2 border border-slate-200 dark:border-slate-700 rounded-xl dark:bg-slate-800 dark:text-white text-sm"
        >
          <option value="all">Todos los estados</option>
          <option value="pending">Pendientes de pago</option>
          <option value="paid">Ya pagados</option>
        </select>

        {hasActiveFilters && (
          <button
            onClick={() => {
              setFilter('all');
              setSelectedMonth('all');
              setSelectedHostId('all');
            }}
            className="px-3 py-2 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            Limpiar filtros
          </button>
        )}
      </div>

      {!isLoading && items.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <div className="bg-white dark:bg-surface-dark p-4 rounded-2xl border border-slate-100 dark:border-slate-800">
            <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Reservas filtradas</p>
            <p className="text-2xl font-bold dark:text-white mt-1">{items.length}</p>
          </div>
          <div className="bg-amber-50 dark:bg-amber-900/20 p-4 rounded-2xl border border-amber-100 dark:border-amber-900/30">
            <p className="text-xs font-bold uppercase tracking-wider text-amber-700 dark:text-amber-400">
              Total retenciones
            </p>
            <p className="text-2xl font-bold text-amber-700 dark:text-amber-300 mt-1">
              {fmtMXN(totals.withheld)}
            </p>
            {(totals.vatWithheld > 0 || totals.isrWithheld > 0 || totals.otherWithheld > 0) && (
              <p className="text-[11px] text-amber-700/80 dark:text-amber-300/80 mt-1">
                IVA: {fmtMXN(totals.vatWithheld)} · ISR: {fmtMXN(totals.isrWithheld)}
                {totals.otherWithheld > 0 ? ` · Otras: ${fmtMXN(totals.otherWithheld)}` : ''}
              </p>
            )}
          </div>
          <div className="bg-white dark:bg-surface-dark p-4 rounded-2xl border border-slate-100 dark:border-slate-800">
            <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Total neto anfitrión</p>
            <p className="text-2xl font-bold dark:text-white mt-1">{fmtMXN(totals.payout)}</p>
          </div>
          <div className="bg-emerald-50 dark:bg-emerald-900/20 p-4 rounded-2xl border border-emerald-100 dark:border-emerald-900/30">
            <p className="text-xs font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-400">
              Pendiente por pagar
            </p>
            <p className="text-2xl font-bold text-emerald-700 dark:text-emerald-300 mt-1">
              {fmtMXN(totals.pendingPayout)}
            </p>
          </div>
        </div>
      )}

      {isLoading ? (
        <Skeleton className="h-64 rounded-3xl" />
      ) : items.length === 0 ? (
        <EmptyState
          title="Sin reservas"
          description="No hay reservas que coincidan con los filtros seleccionados."
          icon="account_balance"
        />
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
            <tfoot className="bg-slate-50 dark:bg-slate-800/70 border-t-2 border-slate-200 dark:border-slate-700 text-sm font-bold dark:text-white">
              <tr>
                <td colSpan={4} className="p-4 text-right uppercase text-xs tracking-wider text-slate-500">
                  Total ({items.length} {items.length === 1 ? 'reserva' : 'reservas'})
                </td>
                <td className="p-4 text-right text-amber-600">{fmtMXN(totals.withheld)}</td>
                <td className="p-4 text-right">{fmtMXN(totals.payout)}</td>
                <td className="p-4" />
              </tr>
            </tfoot>
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
