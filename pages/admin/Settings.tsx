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
    supabase.from('platform_settings').select('*').limit(1).single().then(({ data }) => {
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
      const { error } = await supabase
        .from('platform_settings')
        .update({ commission_percent: commission, updated_at: new Date().toISOString() })
        .eq('id', settingsId);
      if (error) throw error;
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
                Porcentaje que retiene Lugarem de cada reserva. El resto se paga al host.
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

            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-100 rounded-xl p-4 text-sm text-blue-700 dark:text-blue-400">
              <strong>Ejemplo:</strong> Una reserva de $1,000 MXN generaría:
              <ul className="mt-2 ml-4 list-disc">
                <li>Comisión plataforma: ${(1000 * commission / 100).toFixed(2)}</li>
                <li>Pago al host: ${(1000 - 1000 * commission / 100).toFixed(2)}</li>
              </ul>
            </div>

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
