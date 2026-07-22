import React, { useEffect, useMemo, useState } from 'react';
import AdminLayout from '../../components/AdminLayout';
import { supabase } from '../../lib/supabaseClient';
import { toast } from 'sonner';
import {
  DEFAULT_SETTINGS,
  PlatformSettings,
  computeCommissions,
  fmtMXN,
} from '../../src/utils/commissions';

type FormState = PlatformSettings & { commission_percent?: number };

const Settings: React.FC = () => {
  const [form, setForm] = useState<FormState>({ ...DEFAULT_SETTINGS });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [settingsId, setSettingsId] = useState<string | null>(null);

  useEffect(() => {
    supabase.from('platform_settings').select('*').limit(1).maybeSingle().then(({ data }) => {
      if (data) {
        setSettingsId(data.id);
        setForm({
          host_commission_percent: Number(data.host_commission_percent ?? DEFAULT_SETTINGS.host_commission_percent),
          user_commission_percent: Number(data.user_commission_percent ?? DEFAULT_SETTINGS.user_commission_percent),
          vat_percent: Number(data.vat_percent ?? DEFAULT_SETTINGS.vat_percent),
          vat_withholding_percent: Number(data.vat_withholding_percent ?? DEFAULT_SETTINGS.vat_withholding_percent),
          isr_withholding_percent: Number(data.isr_withholding_percent ?? DEFAULT_SETTINGS.isr_withholding_percent),
          other_withholding_percent: Number(data.other_withholding_percent ?? DEFAULT_SETTINGS.other_withholding_percent),
          other_withholding_label: data.other_withholding_label ?? DEFAULT_SETTINGS.other_withholding_label,
          stripe_percent: Number(data.stripe_percent ?? DEFAULT_SETTINGS.stripe_percent),
          stripe_fixed: Number(data.stripe_fixed ?? DEFAULT_SETTINGS.stripe_fixed),
          commission_percent: Number(data.commission_percent ?? 10),
        });
      }
      setLoading(false);
    });
  }, []);

  const set = (k: keyof FormState) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((f) => ({ ...f, [k]: k === 'other_withholding_label' ? e.target.value : Number(e.target.value) }));

  const preview = useMemo(() => computeCommissions(1000, form), [form]);

  const handleSave = async () => {
    setSaving(true);
    try {
      const payload = {
        host_commission_percent: form.host_commission_percent,
        user_commission_percent: form.user_commission_percent,
        vat_percent: form.vat_percent,
        vat_withholding_percent: form.vat_withholding_percent,
        isr_withholding_percent: form.isr_withholding_percent,
        other_withholding_percent: form.other_withholding_percent,
        other_withholding_label: form.other_withholding_label,
        stripe_percent: form.stripe_percent,
        stripe_fixed: form.stripe_fixed,
        commission_percent: form.user_commission_percent, // legacy mirror
        updated_at: new Date().toISOString(),
      };

      if (settingsId) {
        const { data, error } = await supabase
          .from('platform_settings')
          .update(payload)
          .eq('id', settingsId)
          .select('id')
          .maybeSingle();
        if (error) throw error;
        if (!data) {
          const { data: ins, error: insErr } = await supabase
            .from('platform_settings').insert(payload).select('id').single();
          if (insErr) throw insErr;
          setSettingsId(ins.id);
        }
      } else {
        const { data, error } = await supabase
          .from('platform_settings').insert(payload).select('id').single();
        if (error) throw error;
        setSettingsId(data.id);
      }
      toast.success('Configuración actualizada');
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setSaving(false);
    }
  };

  const Row: React.FC<{ label: string; hint?: string; value: number | string; k: keyof FormState; suffix?: string; step?: number; type?: string }> = ({ label, hint, value, k, suffix = '%', step = 0.1, type = 'number' }) => (
    <div>
      <label className="block text-sm font-bold mb-1 dark:text-white">{label}</label>
      {hint && <p className="text-xs text-slate-500 mb-2">{hint}</p>}
      <div className="flex items-center gap-2">
        <input
          type={type}
          step={step}
          value={value as any}
          onChange={set(k)}
          className="w-40 px-4 py-2 border border-slate-200 dark:border-slate-700 rounded-xl dark:bg-slate-800 dark:text-white font-bold"
        />
        <span className="text-lg font-bold text-primary">{suffix}</span>
      </div>
    </div>
  );

  return (
    <AdminLayout>
      <div className="p-6 max-w-3xl">
        <h1 className="text-2xl font-bold font-display mb-2 dark:text-white">Configuración</h1>
        <p className="text-slate-500 mb-8">Todas las tasas son configurables desde aquí. Ninguna está fija en el código.</p>

        {loading ? (
          <p>Cargando...</p>
        ) : (
          <div className="space-y-6">
            <section className="bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-2xl p-6 space-y-5">
              <h2 className="text-lg font-bold dark:text-white">Comisiones</h2>
              <Row label="Comisión del anfitrión" hint="Porcentaje sobre el precio base que Lugare cobra al anfitrión." value={form.host_commission_percent} k="host_commission_percent" />
              <Row label="Comisión del usuario" hint="Porcentaje sobre el precio base que Lugare cobra al usuario (visible en el checkout como cargo de servicio)." value={form.user_commission_percent} k="user_commission_percent" />
            </section>

            <section className="bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-2xl p-6 space-y-5">
              <h2 className="text-lg font-bold dark:text-white">Impuestos</h2>
              <Row label="IVA" hint="Se aplica al precio base y a las comisiones de Lugare." value={form.vat_percent} k="vat_percent" />
            </section>

            <section className="bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-2xl p-6 space-y-5">
              <h2 className="text-lg font-bold dark:text-white">Retenciones fiscales</h2>
              <Row label="Retención de IVA" hint="Porcentaje del IVA total que se retiene al anfitrión." value={form.vat_withholding_percent} k="vat_withholding_percent" />
              <Row label="Retención de ISR" hint="Porcentaje sobre el precio base retenido al anfitrión." value={form.isr_withholding_percent} k="isr_withholding_percent" />
              <div>
                <label className="block text-sm font-bold mb-1 dark:text-white">Etiqueta otra retención</label>
                <input
                  type="text"
                  value={form.other_withholding_label || ''}
                  onChange={set('other_withholding_label')}
                  className="w-full px-4 py-2 border border-slate-200 dark:border-slate-700 rounded-xl dark:bg-slate-800 dark:text-white"
                />
              </div>
              <Row label={`Otra retención`} hint="Cualquier otra retención fiscal (porcentaje sobre precio base)." value={form.other_withholding_percent} k="other_withholding_percent" />
            </section>

            <section className="bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-2xl p-6 space-y-5">
              <h2 className="text-lg font-bold dark:text-white">Pasarela de pago (Stripe)</h2>
              <Row label="Comisión Stripe" value={form.stripe_percent} k="stripe_percent" />
              <Row label="Cargo fijo Stripe" value={form.stripe_fixed} k="stripe_fixed" suffix="MXN" step={1} />
            </section>

            <section className="bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800 rounded-2xl p-6">
              <h3 className="font-bold text-blue-800 dark:text-blue-300 mb-3">Simulador · Reserva base de $1,000 MXN</h3>
              <ul className="text-sm text-blue-900 dark:text-blue-200 space-y-1.5">
                <li>Precio base: <strong>{fmtMXN(preview.basePrice)}</strong></li>
                <li>IVA del espacio ({form.vat_percent}%): <strong>{fmtMXN(preview.vatOnBase)}</strong></li>
                <li>Comisión anfitrión ({form.host_commission_percent}%): <strong>{fmtMXN(preview.hostCommission)}</strong></li>
                <li>Comisión usuario ({form.user_commission_percent}%): <strong>{fmtMXN(preview.userCommission)}</strong></li>
                <li>IVA sobre comisiones Lugare: <strong>{fmtMXN(preview.vatOnLugareCommission)}</strong></li>
                <li>Retención IVA: <strong>{fmtMXN(preview.vatWithheld)}</strong></li>
                <li>Retención ISR: <strong>{fmtMXN(preview.isrWithheld)}</strong></li>
                <li>{form.other_withholding_label || 'Otra retención'}: <strong>{fmtMXN(preview.otherWithheld)}</strong></li>
                <li>Comisión Stripe ({form.stripe_percent}% + {fmtMXN(form.stripe_fixed)}): <strong>{fmtMXN(preview.stripeFee)}</strong></li>
                <li className="pt-2 border-t border-blue-200 dark:border-blue-800 mt-2">Total al usuario: <strong className="text-lg">{fmtMXN(preview.userTotal)}</strong></li>
                <li>Pago neto al anfitrión: <strong>{fmtMXN(preview.hostPayout)}</strong></li>
                <li>Neto Lugare (después Stripe): <strong className={preview.lugareNet < 0 ? 'text-red-600' : ''}>{fmtMXN(preview.lugareNet)}</strong></li>
                <li>Impuestos retenidos total: <strong>{fmtMXN(preview.taxesWithheldTotal)}</strong></li>
              </ul>
            </section>

            <button
              onClick={handleSave}
              disabled={saving}
              className="w-full bg-primary text-white font-bold py-3 rounded-xl disabled:opacity-50"
            >
              {saving ? 'Guardando...' : 'Guardar cambios'}
            </button>
          </div>
        )}
      </div>
    </AdminLayout>
  );
};

export default Settings;
