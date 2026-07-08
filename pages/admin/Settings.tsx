import React, { useEffect, useState } from 'react';
import AdminLayout from '../../components/AdminLayout';
import { supabase } from '../../lib/supabaseClient';
import { toast } from 'sonner';

const Settings: React.FC = () => {
  const [commission, setCommission] = useState<number>(10);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [settingsId, setSettingsId] = useState<string | null>(null);

  useEffect(() => {
    supabase.from('platform_settings').select('*').limit(1).maybeSingle().then(({ data }) => {
      if (data) {
        setCommission(Number(data.commission_percent));
        setSettingsId(data.id);
      }
      setLoading(false);
    });
  }, []);

  const handleSave = async () => {
    if (commission < 0 || commission > 50) {
      toast.error('La comisión debe estar entre 0 y 50%');
      return;
    }
    setSaving(true);
    try {
      let shouldCreateSettings = !settingsId;

      if (settingsId) {
        const { data, error } = await supabase
          .from('platform_settings')
          .update({ commission_percent: commission, updated_at: new Date().toISOString() })
          .eq('id', settingsId)
          .select('id')
          .maybeSingle();
        if (error) throw error;
        if (!data) shouldCreateSettings = true;
      }

      if (shouldCreateSettings) {
        const { data, error } = await supabase
          .from('platform_settings')
          .insert({ commission_percent: commission, updated_at: new Date().toISOString() })
          .select('id')
          .single();
        if (error) throw error;
        setSettingsId(data.id);
      }
      toast.success('Comisión actualizada');
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <AdminLayout>
      <div className="p-6 max-w-2xl">
        <h1 className="text-2xl font-bold font-display mb-2">Configuración</h1>
        <p className="text-slate-500 mb-8">Ajustes globales de la plataforma</p>

        {loading ? (
          <p>Cargando...</p>
        ) : (
          <div className="bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-2xl p-6 space-y-4">
            <div>
              <label className="block text-sm font-bold mb-2">Comisión de plataforma (%)</label>
              <p className="text-xs text-slate-500 mb-3">
                Porcentaje que tiene Lugare por cada reserva. El resto se paga al anfitrión.
              </p>
              <input
                type="number"
                min={0}
                max={50}
                step={0.5}
                value={commission}
                onChange={(e) => setCommission(Number(e.target.value))}
                className="w-32 px-4 py-3 border border-slate-200 dark:border-slate-700 rounded-xl text-lg font-bold"
              />
              <span className="ml-2 text-2xl font-bold text-primary">%</span>
            </div>

            {(() => {
              const reserva = 1000;
              const GATEWAY_PERCENT = 3.6; // Stripe MX estándar
              const GATEWAY_FIXED = 3; // MXN por transacción
              const IVA = 0.16; // IVA sobre comisiones de pasarela en MX
              const comisionPlataforma = reserva * commission / 100;
              const comisionPasarela = (reserva * GATEWAY_PERCENT / 100) + GATEWAY_FIXED;
              const ivaPasarela = comisionPasarela * IVA;
              const totalPasarela = comisionPasarela + ivaPasarela;
              const netoPlataforma = comisionPlataforma - totalPasarela;
              const pagoHost = reserva - comisionPlataforma;
              return (
                <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-100 rounded-xl p-4 text-sm text-blue-700 dark:text-blue-400">
                  <strong>Ejemplo:</strong> Una reserva de $1,000 MXN generaría:
                  <ul className="mt-2 ml-4 list-disc space-y-1">
                    <li>Comisión plataforma ({commission}%): <strong>${comisionPlataforma.toFixed(2)}</strong></li>
                    <li>Pago al host ({(100 - commission).toFixed(1)}%): <strong>${pagoHost.toFixed(2)}</strong></li>
                    <li>
                      Comisión pasarela de pago ({GATEWAY_PERCENT}% + ${GATEWAY_FIXED} MXN + IVA):
                      <strong> ${totalPasarela.toFixed(2)}</strong>
                    </li>
                    <li>
                      Ingreso neto de la plataforma (después de pasarela):
                      <strong className={netoPlataforma < 0 ? 'text-red-600' : ''}> ${netoPlataforma.toFixed(2)}</strong>
                    </li>
                  </ul>
                  <p className="mt-3 text-xs text-blue-600/80 dark:text-blue-300/80">
                    * Tarifas de referencia basadas en Stripe México (3.6% + $3 MXN + IVA). Ajustar al contrato vigente con tu pasarela.
                  </p>
                </div>
              );
            })()}

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
