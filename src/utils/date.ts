/**
 * Utilidades para manejo seguro de fechas locales (evitando desfase de huso horario UTC).
 */

/**
 * Convierte un string de fecha (ej. "YYYY-MM-DD" o "YYYY-MM-DDTHH:mm:ss")
 * a un objeto Date interpretado estrictamente en la zona horaria local.
 */
export const parseLocalDate = (dateStr: string | null | undefined): Date | null => {
  if (!dateStr) return null;
  const match = String(dateStr).match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (match) {
    const [, y, m, d] = match;
    return new Date(Number(y), Number(m) - 1, Number(d));
  }
  const d = new Date(dateStr);
  return isNaN(d.getTime()) ? null : d;
};

/**
 * Formatea una fecha local en español sin desfase de 1 día.
 */
export const formatLocalDate = (
  dateStr: string | null | undefined,
  options: Intl.DateTimeFormatOptions = { day: 'numeric', month: 'long', year: 'numeric' },
  locale = 'es-ES'
): string => {
  if (!dateStr) return '';
  const d = parseLocalDate(dateStr);
  if (!d) return String(dateStr);
  return d.toLocaleDateString(locale, options);
};

/**
 * Retorna la fecha de hoy en formato "YYYY-MM-DD" según la hora local del dispositivo.
 */
export const getTodayDateStr = (): string => {
  return new Date().toLocaleDateString('en-CA');
};
