
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useUser } from '../../../context/UserContext';
import { Invitation } from '../../../types';

const SendInvitation: React.FC = () => {
  const navigate = useNavigate();
  const { draftInvitation, addInvitation, updateDraftInvitation } = useUser();
  const guests = draftInvitation?.guests || [];

  const handleSend = () => {
    if (draftInvitation) {
      const newInvitation: Invitation = {
        id: Date.now().toString(),
        designId: draftInvitation.designId || 'romantico',
        eventName: draftInvitation.eventName || 'Evento sin nombre',
        date: draftInvitation.date || '',
        time: draftInvitation.time || '',
        location: draftInvitation.location || '',
        guests: guests
      };
      addInvitation(newInvitation);
      updateDraftInvitation({}); // Clear draft
      alert('¡Invitaciones enviadas con éxito!');
      navigate('/user/home');
    }
  };

  return (
    <div className="bg-background-light dark:bg-background-dark text-slate-800 dark:text-slate-100 min-h-screen flex flex-col max-w-md mx-auto">
      <header className="bg-white dark:bg-background-dark px-6 py-4 flex items-center justify-between border-b border-slate-100 dark:border-slate-800 sticky top-0 z-50">
        <button 
          onClick={() => navigate(-1)}
          className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors"
        >
          <span className="material-icons-outlined text-slate-700 dark:text-slate-200">arrow_back</span>
        </button>
        <h1 className="text-lg font-bold text-slate-900 dark:text-white">Enviar Invitación</h1>
        <div className="w-8"></div> 
      </header>

      <main className="flex-1 overflow-y-auto pb-32">
        <div className="px-6 py-4">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm font-medium text-slate-600 dark:text-slate-400">Paso 3 de 3</span>
            <span className="text-sm font-medium text-slate-400 dark:text-slate-500">Enviar invitación</span>
          </div>
          <div className="w-full h-2 bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden">
            <div className="h-full bg-primary w-full"></div>
          </div>
        </div>

        <div className="px-6 mt-4">
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-6">Tu invitados</h2>
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
                <div key={i} className="flex items-center justify-between p-4 mb-3 bg-white dark:bg-surface-dark rounded-xl shadow-sm border border-slate-100 dark:border-slate-800 transition-transform active:scale-[0.98]">
                  <div className="flex-1">
                    <h4 className="font-semibold text-slate-800 dark:text-slate-100 text-[15px]">{guest.name}</h4>
                    <p className="text-sm text-slate-400 dark:text-slate-500">{guest.email}</p>
                  </div>
                  <div className="flex gap-2">
                    <button className="w-9 h-9 flex items-center justify-center bg-secondary/10 text-secondary rounded-lg hover:bg-secondary hover:text-white transition-colors">
                      <span className="material-icons-outlined text-[20px]">edit</span>
                    </button>
                    <button className="w-9 h-9 flex items-center justify-center bg-red-50 dark:bg-red-950/30 text-red-500 rounded-lg hover:bg-red-500 hover:text-white transition-colors">
                      <span className="material-icons-outlined text-[20px]">delete</span>
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </main>

      <footer className="fixed bottom-0 left-0 right-0 max-w-md mx-auto bg-white/80 dark:bg-background-dark/80 backdrop-blur-md p-6 border-t border-slate-100 dark:border-slate-800 z-50">
        <button 
          onClick={handleSend}
          className="w-full py-4 bg-primary hover:bg-orange-600 text-white font-bold text-lg rounded-2xl transition-all shadow-lg shadow-primary/30 active:scale-[0.98]"
        >
          INVITAR
        </button>
        <div className="mt-4 flex justify-center">
          <div className="w-32 h-1.5 bg-slate-200 dark:bg-slate-700 rounded-full"></div>
        </div>
      </footer>
    </div>
  );
};

export default SendInvitation;
