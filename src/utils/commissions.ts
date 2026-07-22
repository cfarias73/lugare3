// Motor de cálculo de comisiones, impuestos y retenciones.
// Todas las tasas provienen de `platform_settings` (editables en /admin/settings).
// IMPORTANTE: si cambias fórmulas aquí, replica en supabase/functions/create-checkout/index.ts

export interface PlatformSettings {
  host_commission_percent: number;   // ej. 3.5
  user_commission_percent: number;   // ej. 14
  vat_percent: number;               // ej. 16
  vat_withholding_percent: number;   // ej. 50 (% del IVA retenido)
  isr_withholding_percent: number;   // ej. 0
  other_withholding_percent: number; // ej. 0
  other_withholding_label?: string;
  stripe_percent: number;            // ej. 3.6
  stripe_fixed: number;              // ej. 3 (MXN)
}

export const DEFAULT_SETTINGS: PlatformSettings = {
  host_commission_percent: 3.5,
  user_commission_percent: 14,
  vat_percent: 16,
  vat_withholding_percent: 0,
  isr_withholding_percent: 0,
  other_withholding_percent: 0,
  other_withholding_label: 'Otra retención',
  stripe_percent: 3.6,
  stripe_fixed: 3,
};

export interface CommissionBreakdown {
  basePrice: number;
  vatOnBase: number;
  hostCommission: number;
  userCommission: number;
  vatOnHostCommission: number;
  vatOnUserCommission: number;
  vatOnLugareCommission: number; // suma de las dos anteriores
  vatWithheld: number;
  isrWithheld: number;
  otherWithheld: number;
  taxesWithheldTotal: number;
  stripeFee: number;
  userTotal: number;   // lo que paga el usuario
  hostPayout: number;  // neto anfitrión
  lugareGross: number; // comisiones + IVA de comisiones
  lugareNet: number;   // gross - stripe - retenciones a favor de terceros
}

const pct = (n: number, p: number) => n * (p / 100);

/**
 * Calcula el desglose completo a partir del precio base del espacio
 * (subtotal sin IVA ni comisiones — lo que cobraría el anfitrión "bruto").
 */
export const computeCommissions = (
  basePrice: number,
  s: PlatformSettings
): CommissionBreakdown => {
  const base = Math.max(0, Number(basePrice) || 0);

  const vatOnBase = pct(base, s.vat_percent);

  const hostCommission = pct(base, s.host_commission_percent);
  const userCommission = pct(base, s.user_commission_percent);

  const vatOnHostCommission = pct(hostCommission, s.vat_percent);
  const vatOnUserCommission = pct(userCommission, s.vat_percent);
  const vatOnLugareCommission = vatOnHostCommission + vatOnUserCommission;

  // Retenciones: sobre el IVA total (base + comisiones) e ISR sobre base host
  const vatWithheld = pct(vatOnBase + vatOnLugareCommission, s.vat_withholding_percent);
  const isrWithheld = pct(base, s.isr_withholding_percent);
  const otherWithheld = pct(base, s.other_withholding_percent);
  const taxesWithheldTotal = vatWithheld + isrWithheld + otherWithheld;

  // Total al usuario: base + IVA base + comisión usuario + IVA de esa comisión + stripe
  const subtotalBeforeStripe =
    base + vatOnBase + userCommission + vatOnUserCommission;
  const stripeFee = pct(subtotalBeforeStripe, s.stripe_percent) + (Number(s.stripe_fixed) || 0);
  const userTotal = subtotalBeforeStripe + stripeFee;

  // Neto anfitrión: recibe base + IVA base menos su comisión (con IVA) y retenciones
  const hostPayout =
    base + vatOnBase - hostCommission - vatOnHostCommission - taxesWithheldTotal;

  const lugareGross = hostCommission + userCommission + vatOnLugareCommission;
  const lugareNet = lugareGross - stripeFee;

  return {
    basePrice: base,
    vatOnBase,
    hostCommission,
    userCommission,
    vatOnHostCommission,
    vatOnUserCommission,
    vatOnLugareCommission,
    vatWithheld,
    isrWithheld,
    otherWithheld,
    taxesWithheldTotal,
    stripeFee,
    userTotal,
    hostPayout,
    lugareGross,
    lugareNet,
  };
};

export const loadPlatformSettings = async (
  supabase: { from: (t: string) => any }
): Promise<PlatformSettings> => {
  const { data } = await supabase
    .from('platform_settings')
    .select('*')
    .limit(1)
    .maybeSingle();
  if (!data) return { ...DEFAULT_SETTINGS };
  return {
    host_commission_percent: Number(data.host_commission_percent ?? DEFAULT_SETTINGS.host_commission_percent),
    user_commission_percent: Number(data.user_commission_percent ?? DEFAULT_SETTINGS.user_commission_percent),
    vat_percent: Number(data.vat_percent ?? DEFAULT_SETTINGS.vat_percent),
    vat_withholding_percent: Number(data.vat_withholding_percent ?? DEFAULT_SETTINGS.vat_withholding_percent),
    isr_withholding_percent: Number(data.isr_withholding_percent ?? DEFAULT_SETTINGS.isr_withholding_percent),
    other_withholding_percent: Number(data.other_withholding_percent ?? DEFAULT_SETTINGS.other_withholding_percent),
    other_withholding_label: data.other_withholding_label ?? DEFAULT_SETTINGS.other_withholding_label,
    stripe_percent: Number(data.stripe_percent ?? DEFAULT_SETTINGS.stripe_percent),
    stripe_fixed: Number(data.stripe_fixed ?? DEFAULT_SETTINGS.stripe_fixed),
  };
};

export const fmtMXN = (n: number) =>
  `$${(Number(n) || 0).toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
