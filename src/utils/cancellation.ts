// Modelo de cancelaciones de la plataforma Lugare.
// 3 tipos: no reembolsable, flexible (días de anticipación) y personalizada (escalones).

export type CancellationType = 'non_refundable' | 'flexible' | 'custom';

export interface CancellationTier {
  /** Días de anticipación mínimos respecto a la fecha del evento */
  days: number;
  /** Porcentaje de reembolso (0-100) si se cancela con al menos `days` de anticipación */
  percent: number;
}

export interface CancellationPolicy {
  type: CancellationType;
  /** Solo para `flexible`: días de anticipación para reembolso 100% */
  days?: number;
  /** Solo para `custom` */
  tiers?: CancellationTier[];
}

export const FLEXIBLE_DAY_OPTIONS = [7, 14, 30, 60, 90];

export const DEFAULT_POLICY: CancellationPolicy = { type: 'non_refundable' };

export const CANCELLATION_LABELS: Record<CancellationType, string> = {
  non_refundable: 'No reembolsable',
  flexible: 'Flexible',
  custom: 'Personalizada',
};

const clampPercent = (n: number) => Math.min(100, Math.max(0, Math.round(Number(n) || 0)));

/** Normaliza lo que venga de la base de datos a una política válida */
export const parsePolicy = (
  type?: string | null,
  days?: number | string | null,
  tiers?: unknown,
): CancellationPolicy => {
  const t: CancellationType =
    type === 'flexible' || type === 'custom' || type === 'non_refundable'
      ? type
      : 'non_refundable';

  if (t === 'flexible') {
    const d = Number(days);
    return { type: 'flexible', days: Number.isFinite(d) && d > 0 ? Math.round(d) : 30 };
  }

  if (t === 'custom') {
    const raw = Array.isArray(tiers) ? tiers : [];
    const parsed = raw
      .map((x: any) => ({ days: Math.round(Number(x?.days)), percent: clampPercent(x?.percent) }))
      .filter((x) => Number.isFinite(x.days) && x.days >= 0)
      .sort((a, b) => b.days - a.days);
    return { type: 'custom', tiers: parsed };
  }

  return { type: 'non_refundable' };
};

/** Días completos entre hoy y la fecha del evento (puede ser negativo si ya pasó) */
export const daysUntil = (eventDate: string | Date, now: Date = new Date()): number => {
  const ev = typeof eventDate === 'string' ? new Date(`${eventDate.slice(0, 10)}T00:00:00`) : eventDate;
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const target = new Date(ev.getFullYear(), ev.getMonth(), ev.getDate());
  return Math.round((target.getTime() - today.getTime()) / 86400000);
};

/** Porcentaje de reembolso aplicable si se cancela hoy */
export const refundPercentFor = (
  policy: CancellationPolicy,
  eventDate: string | Date,
  now: Date = new Date(),
): number => {
  const d = daysUntil(eventDate, now);
  if (d < 0) return 0;

  if (policy.type === 'non_refundable') return 0;
  if (policy.type === 'flexible') return d >= (policy.days ?? 30) ? 100 : 0;

  const tiers = (policy.tiers ?? []).slice().sort((a, b) => b.days - a.days);
  for (const tier of tiers) {
    if (d >= tier.days) return clampPercent(tier.percent);
  }
  return 0;
};

export const refundAmountFor = (
  policy: CancellationPolicy,
  eventDate: string | Date,
  total: number,
  now: Date = new Date(),
): number => Math.round(((refundPercentFor(policy, eventDate, now) / 100) * (Number(total) || 0)) * 100) / 100;

/** Texto legible de la política para mostrar al usuario */
export const describePolicy = (policy: CancellationPolicy): string[] => {
  if (policy.type === 'non_refundable') {
    return ['El anfitrión no acepta cancelaciones. Puedes cancelar tu reserva, pero no habrá reembolso.'];
  }
  if (policy.type === 'flexible') {
    const d = policy.days ?? 30;
    return [
      `Cancelación gratuita (100% de reembolso) hasta ${d} días antes de la fecha del evento.`,
      `Si cancelas dentro de los ${d} días previos, no habrá reembolso.`,
    ];
  }
  const tiers = (policy.tiers ?? []).slice().sort((a, b) => b.days - a.days);
  if (tiers.length === 0) return ['El anfitrión no ha definido condiciones de cancelación.'];
  const lines = tiers.map((t) => `${t.percent}% de reembolso si cancelas con ${t.days} días o más de anticipación.`);
  lines.push('Sin reembolso fuera de estos plazos.');
  return lines;
};

export const shortPolicyLabel = (policy: CancellationPolicy): string => {
  if (policy.type === 'flexible') return `Flexible · ${policy.days ?? 30} días`;
  if (policy.type === 'custom') return 'Personalizada';
  return 'No reembolsable';
};
