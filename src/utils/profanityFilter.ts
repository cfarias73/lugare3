// Lista básica de palabras ofensivas en español (variantes comunes).
// No es exhaustiva, pero cubre los términos más altisonantes/groseros.
const PROFANITY_LIST = [
  'puta','puto','putos','putas','pendejo','pendeja','pendejos','pendejas',
  'cabron','cabrón','cabrones','cabrona','cabronas',
  'mierda','mierdas','joder','jodete','jódete','jodido','jodida',
  'verga','vergas','culero','culera','culeros','culeras','culo','culos',
  'chinga','chingada','chingado','chingadera','chingaderas','chingar','chingue','chingues','chinguen',
  'pinche','pinches','pendej','wey','güey','güeyes','gueyes',
  'mamada','mamadas','mamon','mamón','mamones','mamona','mamonas',
  'cojer','coger','cojiendo','cogiendo','follar','follando',
  'puto','perra','perras','zorra','zorras','marica','maricón','maricon','maricones',
  'imbecil','imbécil','idiota','idiotas','estupido','estúpido','estupidos','estúpidos',
  'fuck','fucking','shit','bitch','asshole','dick','cunt','bastard',
];

const normalize = (s: string) =>
  s
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // quita acentos
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

export const containsProfanity = (text: string): boolean => {
  if (!text) return false;
  const normalized = normalize(text);
  const tokens = normalized.split(' ');
  return tokens.some((token) =>
    PROFANITY_LIST.some((bad) => token === bad || token.includes(bad))
  );
};

export const validateSpaceName = (name: string): string | null => {
  const trimmed = name.trim();
  if (!trimmed) return 'El nombre es requerido';
  if (trimmed.length < 3) return 'El nombre debe tener al menos 3 caracteres';
  if (trimmed.length > 60) return 'El nombre no puede exceder 60 caracteres';
  // Solo letras, números, espacios y signos básicos
  if (!/^[\p{L}\p{N}\s.,'&\-()]+$/u.test(trimmed)) {
    return 'El nombre contiene caracteres no permitidos';
  }
  if (containsProfanity(trimmed)) {
    return 'El nombre contiene lenguaje no permitido. Por favor usa un nombre apropiado.';
  }
  return null;
};
