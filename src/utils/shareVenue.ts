import { Capacitor } from '@capacitor/core';
import { Share } from '@capacitor/share';

const SITE_URL = 'https://www.lugare.mx';

const copyToClipboard = async (value: string) => {
  if (navigator.clipboard?.writeText) {
    await navigator.clipboard.writeText(value);
    return;
  }

  const textArea = document.createElement('textarea');
  textArea.value = value;
  textArea.setAttribute('readonly', '');
  textArea.style.position = 'fixed';
  textArea.style.left = '-9999px';
  document.body.appendChild(textArea);
  textArea.select();
  const copied = document.execCommand('copy');
  document.body.removeChild(textArea);

  if (!copied) throw new Error('No se pudo copiar el enlace');
};

const isCancellation = (error: unknown) => {
  if (error instanceof DOMException && error.name === 'AbortError') return true;
  const message = error instanceof Error ? error.message.toLowerCase() : '';
  return message.includes('cancel');
};

export const shareVenue = async (venueId: string, venueName: string): Promise<'shared' | 'copied' | 'cancelled'> => {
  const baseUrl = Capacitor.isNativePlatform() ? SITE_URL : window.location.origin;
  const url = `${baseUrl}/#/user/venue/${encodeURIComponent(venueId)}`;
  const text = `Mira este espacio para eventos en Lugare: ${venueName}`;

  try {
    if (Capacitor.isNativePlatform()) {
      await Share.share({
        title: venueName,
        text,
        url,
        dialogTitle: 'Compartir espacio',
      });
      return 'shared';
    }

    if (navigator.share) {
      await navigator.share({ title: venueName, text, url });
      return 'shared';
    }

    await copyToClipboard(url);
    return 'copied';
  } catch (error) {
    if (isCancellation(error)) return 'cancelled';

    try {
      await copyToClipboard(url);
      return 'copied';
    } catch {
      throw error;
    }
  }
};
