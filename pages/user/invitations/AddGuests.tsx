
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useUser } from '../../../context/UserContext';
import { Guest } from '../../../types';

const AddGuests: React.FC = () => {
  const navigate = useNavigate();
  const { draftInvitation, updateDraftInvitation } = useUser();
  const [guests, setGuests] = useState<Guest[]>(draftInvitation?.guests || []);
  const [newGuestName, setNewGuestName] = useState('');
  const [newGuestEmail, setNewGuestEmail] = useState('');

  const handleAddGuest = () => {
    if (newGuestName && newGuestEmail) {
      const newGuest: Guest = {
        id: Date.now().toString(),
        name: newGuestName,
        email: newGuestEmail
      };
      setGuests([...guests, newGuest]);
      setNewGuestName('');
      setNewGuestEmail('');
    }
  };

  const handleRemoveGuest = (id: string) => {
    setGuests(guests.filter(g => g.id !== id));
  };

  const handleNext = () => {
    updateDraftInvitation({ guests });
    navigate('/user/invitations/send');
  };

  return (
    <div className="bg-background-light dark:bg-background-dark text-slate-800 dark:text-slate-100 min-h-screen flex flex-col max-w-md mx-auto">
      <header className="sticky top-0 z-10 bg-white dark:bg-background-dark border-b border-slate-100 dark:border-slate-800 px-4 py-4 flex items-center justify-between">
        <button 
          onClick={() => navigate(-1)}
          className="p-2 -ml-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
        >
          <span className="material-icons-outlined text-slate-700 dark:text-slate-300">arrow_back</span>
        </button>
        <h1 className="text-lg font-semibold text-slate-800 dark:text-white">Agregar Invitados</h1>
        <div className="w-10"></div> 
      </header>

      <main className="flex-1 overflow-y-auto px-6 py-6 bg-slate-50 dark:bg-background-dark pb-32">
        <div className="mb-8">
          <div className="flex justify-between items-end mb-2">
            <p className="text-sm font-medium text-slate-700 dark:text-slate-300">Paso 2 de 3</p>
            <p className="text-xs text-slate-400 dark:text-slate-500">Agregar invitados</p>
          </div>
          <div className="h-2 w-full bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden">
            <div className="h-full bg-primary w-2/3 rounded-full"></div>
          </div>
        </div>

        <div className="mb-8">
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">Invita a tus amigos</h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
            Agrega el nombre y email de las personas que quieres invitar
          </p>
        </div>

        <div className="bg-white dark:bg-surface-dark p-6 rounded-3xl shadow-sm border border-slate-100 dark:border-slate-800 mb-8">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-12 h-12 rounded-full bg-orange-50 dark:bg-orange-900/20 flex items-center justify-center">
              <span className="material-icons-outlined text-primary">person_add</span>
            </div>
            <h3 className="font-semibold text-slate-800 dark:text-white">Nuevo invitado</h3>
          </div>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-600 dark:text-slate-400 mb-1.5 ml-1">Nombre completo</label>
              <div className="relative">
                <span className="material-icons-outlined absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 text-[20px]">person</span>
                <input 
                  className="w-full pl-12 pr-4 py-3.5 bg-slate-50 dark:bg-slate-800 border-none rounded-2xl focus:ring-2 focus:ring-primary/20 text-slate-800 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 transition-all outline-none" 
                  placeholder="Ej. María García" 
                  type="text"
                  value={newGuestName}
                  onChange={(e) => setNewGuestName(e.target.value)}
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-600 dark:text-slate-400 mb-1.5 ml-1">Correo electrónico</label>
              <div className="relative">
                <span className="material-icons-outlined absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 text-[20px]">mail</span>
                <input 
                  className="w-full pl-12 pr-4 py-3.5 bg-slate-50 dark:bg-slate-800 border-none rounded-2xl focus:ring-2 focus:ring-primary/20 text-slate-800 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 transition-all outline-none" 
                  placeholder="maria@ejemplo.com" 
                  type="email"
                  value={newGuestEmail}
                  onChange={(e) => setNewGuestEmail(e.target.value)}
                />
              </div>
            </div>
            <button 
              onClick={handleAddGuest}
              className="w-full bg-secondary text-white font-semibold py-4 rounded-2xl flex items-center justify-center gap-2 mt-2 transition-opacity active:scale-[0.98] hover:bg-secondary/90"
            >
              <span className="material-icons-outlined">add</span>
              Agregar invitado
            </button>
          </div>
        </div>

        <div>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-bold text-slate-800 dark:text-white">Lista de invitados</h3>
            <span className="bg-primary text-white text-xs font-bold px-2.5 py-1 rounded-full">{guests.length}</span>
          </div>
          <div className="bg-white dark:bg-surface-dark p-4 rounded-3xl shadow-sm border border-slate-100 dark:border-slate-800 space-y-3">
            {guests.length === 0 ? (
              <p className="text-center text-slate-400 py-4 text-sm">No hay invitados agregados aún.</p>
            ) : (
              guests.map((guest) => (
                <div key={guest.id} className="flex items-center justify-between p-3 border border-slate-100 dark:border-slate-800 rounded-2xl">
                  <div className="flex-1">
                    <h4 className="font-semibold text-slate-800 dark:text-white text-sm">{guest.name}</h4>
                    <p className="text-xs text-slate-400 dark:text-slate-500">{guest.email}</p>
                  </div>
                  <div className="flex gap-2">
                    <button className="w-9 h-9 flex items-center justify-center rounded-xl bg-secondary/10 text-secondary hover:bg-secondary/20">
                      <span className="material-icons-outlined text-[20px]">edit</span>
                    </button>
                    <button 
                      onClick={() => handleRemoveGuest(guest.id)}
                      className="w-9 h-9 flex items-center justify-center rounded-xl bg-red-50 dark:bg-red-900/20 text-red-500 hover:bg-red-100 dark:hover:bg-red-900/40"
                    >
                      <span className="material-icons-outlined text-[20px]">delete</span>
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </main>

      <footer className="fixed bottom-0 left-0 right-0 bg-white dark:bg-background-dark border-t border-slate-100 dark:border-slate-800 px-6 py-5 flex gap-4 max-w-md mx-auto z-50">
        <button 
          onClick={() => navigate(-1)}
          className="flex-1 py-4 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold rounded-2xl hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
        >
          Atrás
        </button>
        <button 
          onClick={handleNext}
          className="flex-[1.2] py-4 bg-primary text-white font-bold rounded-2xl transition-all hover:bg-orange-600 shadow-lg shadow-primary/20"
        >
          Continuar
        </button>
      </footer>
    </div>
  );
};

export default AddGuests;
