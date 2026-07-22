
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { useUser } from '../../../context/UserContext';
import { Invitation } from '../../../types';
import { createInvitation } from '../../../src/services/invitationService';
import InvitationPreview from '../../../components/InvitationPreview';

const SendInvitation: React.FC = () => {
  const navigate = useNavigate();
  const { user, draftInvitation, addInvitation, updateDraftInvitation } = useUser();
  const guests = draftInvitation?.guests || [];
  const [sending, setSending] = useState(false);
  const [shareUrl, setShareUrl] = useState<string | null>(null);

  const shareMessage = () => {
    const name = draftInvitation?.eventName || 'mi evento';
    const date = draftInvitation?.date ? ` el ${draftInvitation.date}` : '';
    return `¡Estás invitado a ${name}${date}! 🎉\nMira los detalles aquí: ${shareUrl}`;
  };

  const handleSend = async () => {
    if (!draftInvitation) return;
    if (!user) {
      toast.error('Debes iniciar sesión para enviar invitaciones.');
      navigate('/user/login');
      return;
    }
    setSending(true);
    const saved = await createInvitation(user.id, {
      designId: draftInvitation.designId || 'romantico',
      eventName: draftInvitation.eventName || 'Evento sin nombre',
      date: draftInvitation.date || '',
      time: draftInvitation.time || '',
      location: draftInvitation.location || '',
      guests,
    });
    setSending(false);
    if (!saved) {
      toast.error('No se pudo guardar la invitación. Intenta de nuevo.');
      return;
    }
    const newInvitation: Invitation = {
      id: saved.id,
      designId: saved.design_id,
      eventName: saved.event_name,
      date: saved.event_date || '',
      time: saved.event_time || '',
      location: saved.location || '',
      guests,
    };
    addInvitation(newInvitation);
    updateDraftInvitation({});
    const origin = window.location.origin + window.location.pathname;
    // HashRouter URL
    const url = `${origin}#/invite/${saved.id}`;
    setShareUrl(url);
    toast.success('¡Invitación lista para compartir!');
  };

  const copyLink = async () => {
    if (!shareUrl) return;
    try {
      await navigator.clipboard.writeText(shareUrl);
      toast.success('Enlace copiado');
    } catch {
      toast.error('No se pudo copiar');
    }
  };

  const shareWhatsApp = () => {
    if (!shareUrl) return;
    window.open(`https://wa.me/?text=${encodeURIComponent(shareMessage())}`, '_blank');
  };

  const shareEmail = () => {
    if (!shareUrl) return;
    const subject = encodeURIComponent(`Invitación: ${draftInvitation?.eventName || 'mi evento'}`);
    const body = encodeURIComponent(shareMessage());
    window.location.href = `mailto:?subject=${subject}&body=${body}`;
  };

  const shareNative = async () => {
    if (!shareUrl) return;
    if (navigator.share) {
      try {
        await navigator.share({ title: draftInvitation?.eventName || 'Invitación', text: shareMessage(), url: shareUrl });
      } catch { /* canceled */ }
    } else {
      copyLink();
    }
  };

  return (
    <div className="bg-background-light dark:bg-background-dark text-slate-800 dark:text-slate-100 min-h-screen flex flex-col max-w-md mx-auto">
      <header className="bg-white dark:bg-background-dark px-6 py-4 flex items-center justify-between border-b border-slate-100 dark:border-slate-800 sticky top-0 z-50">
        <button onClick={() => navigate(-1)} className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors">
          <span className="material-icons-outlined text-slate-700 dark:text-slate-200">arrow_back</span>
        </button>
        <h1 className="text-lg font-bold text-slate-900 dark:text-white">Enviar Invitación</h1>
        <div className="w-8"></div>
      </header>

      <main className="flex-1 overflow-y-auto pb-32">
        <div className="px-6 py-4">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm font-medium text-slate-600 dark:text-slate-400">Paso 3 de 3</span>
            <span className="text-sm font-medium text-slate-400 dark:text-slate-500">Compartir invitación</span>
          </div>
          <div className="w-full h-2 bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden">
            <div className="h-full bg-primary w-full"></div>
          </div>
        </div>

        {shareUrl ? (
          <div className="px-6 mt-4 space-y-5">
            <div className="bg-gradient-to-br from-primary/10 to-orange-50 dark:from-primary/20 dark:to-slate-900 p-6 rounded-3xl border border-primary/20">
              <div className="flex items-center gap-2 mb-3">
                <span className="material-icons-round text-primary">check_circle</span>
                <h2 className="text-lg font-bold text-slate-900 dark:text-white">Tu invitación está lista</h2>
              </div>
              <p className="text-sm text-slate-600 dark:text-slate-300 mb-4">
                Comparte el enlace con tus {guests.length} invitado{guests.length === 1 ? '' : 's'} por el medio que prefieras.
              </p>
              <div className="bg-white dark:bg-surface-dark border border-slate-200 dark:border-slate-700 rounded-xl p-3 flex items-center gap-2">
                <input
                  readOnly
                  value={shareUrl}
                  className="flex-1 bg-transparent text-xs text-slate-700 dark:text-slate-200 outline-none truncate"
                  onFocus={(e) => e.target.select()}
                />
                <button onClick={copyLink} className="bg-primary text-white text-xs font-bold px-3 py-2 rounded-lg active:scale-95">
                  Copiar
                </button>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <button onClick={shareWhatsApp} className="flex flex-col items-center gap-2 p-4 bg-white dark:bg-surface-dark rounded-2xl border border-slate-100 dark:border-slate-800 active:scale-95 transition">
                <div className="w-12 h-12 rounded-full bg-green-500 text-white flex items-center justify-center">
                  <span className="material-icons-outlined">chat</span>
                </div>
                <span className="text-xs font-semibold text-slate-700 dark:text-slate-200">WhatsApp</span>
              </button>
              <button onClick={shareEmail} className="flex flex-col items-center gap-2 p-4 bg-white dark:bg-surface-dark rounded-2xl border border-slate-100 dark:border-slate-800 active:scale-95 transition">
                <div className="w-12 h-12 rounded-full bg-blue-500 text-white flex items-center justify-center">
                  <span className="material-icons-outlined">mail</span>
                </div>
                <span className="text-xs font-semibold text-slate-700 dark:text-slate-200">Email</span>
              </button>
              <button onClick={shareNative} className="flex flex-col items-center gap-2 p-4 bg-white dark:bg-surface-dark rounded-2xl border border-slate-100 dark:border-slate-800 active:scale-95 transition">
                <div className="w-12 h-12 rounded-full bg-slate-800 text-white flex items-center justify-center">
                  <span className="material-icons-outlined">ios_share</span>
                </div>
                <span className="text-xs font-semibold text-slate-700 dark:text-slate-200">Más</span>
              </button>
            </div>

            <div className="bg-slate-50 dark:bg-slate-900/40 rounded-2xl p-4 border border-slate-100 dark:border-slate-800">
              <p className="text-xs text-slate-500 dark:text-slate-400">
                💡 Tip: pega el enlace en tu grupo de WhatsApp para enviarlo a todos a la vez sin costo.
              </p>
            </div>
          </div>
        ) : (
          <>
            <div className="px-6 mt-4">
              <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-6">Tus invitados</h2>
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-200">Lista de invitados</h3>
                <span className="bg-primary text-white text-xs font-bold px-3 py-1 rounded-full shadow-sm shadow-primary/20">{guests.length}</span>
              </div>
            </div>
            <div className="px-4">
              <div className="bg-slate-50/50 dark:bg-slate-900/40 p-2 rounded-2xl border border-white/50 dark:border-slate-800/50 space-y-3">
                {guests.length === 0 ? (
                  <p className="text-center text-slate-400 py-4">No hay invitados para mostrar.</p>
                ) : (
                  guests.map((guest, i) => (
                    <div key={i} className="flex items-center justify-between p-4 mb-3 bg-white dark:bg-surface-dark rounded-xl shadow-sm border border-slate-100 dark:border-slate-800">
                      <div className="flex-1">
                        <h4 className="font-semibold text-slate-800 dark:text-slate-100 text-[15px]">{guest.name}</h4>
                        <p className="text-sm text-slate-400 dark:text-slate-500">{guest.email}</p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </>
        )}
      </main>

      <footer className="fixed bottom-0 left-0 right-0 max-w-md mx-auto bg-white/80 dark:bg-background-dark/80 backdrop-blur-md p-6 border-t border-slate-100 dark:border-slate-800 z-50">
        {shareUrl ? (
          <button onClick={() => navigate('/user/home')} className="w-full py-4 bg-primary hover:bg-orange-600 text-white font-bold text-lg rounded-2xl transition-all shadow-lg shadow-primary/30 active:scale-[0.98]">
            Listo
          </button>
        ) : (
          <button onClick={handleSend} disabled={sending} className="w-full py-4 bg-primary hover:bg-orange-600 text-white font-bold text-lg rounded-2xl transition-all shadow-lg shadow-primary/30 active:scale-[0.98] disabled:opacity-60">
            {sending ? 'Generando enlace...' : 'GENERAR ENLACE'}
          </button>
        )}
      </footer>
    </div>
  );
};

export default SendInvitation;
