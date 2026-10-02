export const getInitialsAvatar = (name?: string | null, fallback = 'U'): string => {
  const cleanName = (name || '').trim();
  const displayName = cleanName.length > 0 ? cleanName : fallback;
  return `https://ui-avatars.com/api/?name=${encodeURIComponent(displayName)}&background=0D9488&color=ffffff&bold=true&size=256`;
};
