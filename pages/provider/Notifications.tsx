
import React from 'react';
import { useNavigate } from 'react-router-dom';
import ProviderLayout from '../../components/ProviderLayout';

const Notifications: React.FC = () => {
  const navigate = useNavigate();

  const SECTIONS = [
    {
      title: 'Hoy',
      items: [
        { id: 1, type: 'consulta', title: 'Nueva consulta', detail: 'de María Rodríguez sobre "Casa con jardín"', time: 'Hace 30 minutos', color: 'border-primary', icon: 'chat_bubble', iconColor: 'text-primary', unread: true },
        { id: 2, type: 'reserva', title: 'Reserva confirmada', detail: 'para "Salón de eventos" con Carlos Gómez', time: 'Hace 2 horas', color: 'border-teal-400', icon: 'calendar_today', iconColor: 'text-teal-500', unread: true },
        { id: 3, type: 'pago', title: 'Pago recibido', detail: 'de $250 por reserva #1234', time: 'Hace 3 horas', color: 'border-amber-400', icon: 'payments', iconColor: 'text-amber-500', unread: true },
      ]
    },
    {
      title: 'Ayer',
      items: [
        { id: 4, type: 'reseña', title: 'Nueva reseña', detail: 'de Laura Martínez para "Terraza con piscina"', time: 'Ayer, 15:45', color: 'border-slate-100 dark:border-slate-800', icon: 'star', iconColor: 'text-amber-500', unread: false },
        { id: 5, type: 'consulta', title: 'Nueva consulta', detail: 'de Javier López sobre "Loft industrial"', time: 'Ayer, 10:20', color: 'border-slate-100 dark:border-slate-800', icon: 'chat_bubble', iconColor: 'text-primary', unread: false },
        { id: 6, type: 'cancelacion', title: 'Cancelación de reserva', detail: 'para "Casa de playa" de Ana Martín', time: 'Ayer, 09:15', color: 'border-slate-100 dark:border-slate-800', icon: 'event_busy', iconColor: 'text-red-500', unread: false },
      ]
    }
  ];

  return (
    <ProviderLayout>
      <header className="sticky top-0 z-50 bg-white dark:bg-card-dark shadow-sm px-4 pt-10 pb-3 transition-colors">
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-3">
            <button onClick={() => navigate(-1)} className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full">
              <span className="material-icons-round text-slate-800 dark:text-slate-100">arrow_back</span>
            </button>
            <h1 className="text-xl font-bold dark:text-white font-display tracking-tight">Centro de Notificaciones</h1>
          </div>
          <button className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full">
            <span className="material-icons-round text-slate-800 dark:text-slate-100">settings</span>
          </button>
        </div>
        <div className="flex justify-between items-center text-[13px] font-bold uppercase tracking-wider border-b border-slate-100 dark:border-slate-800 no-scrollbar overflow-x-auto">
          <div className="px-4 py-3 border-b-2 border-primary text-primary whitespace-nowrap">Todas</div>
          <div className="px-4 py-3 text-slate-400 dark:text-slate-500 whitespace-nowrap">Reservas</div>
          <div className="px-4 py-3 text-slate-400 dark:text-slate-500 whitespace-nowrap">Mensajes</div>
          <div className="px-4 py-3 text-slate-400 dark:text-slate-500 whitespace-nowrap">Pagos</div>
        </div>
      </header>

      <div className="flex justify-between items-center px-4 py-4 sticky top-[138px] z-20 bg-background-light dark:bg-background-dark/95 backdrop-blur-md">
        <button className="flex items-center gap-2 bg-white dark:bg-card-dark px-5 py-2.5 rounded-full shadow-sm text-sm font-bold border border-slate-50 dark:border-slate-800 group active:scale-95 transition-all">
          <span className="material-icons-round text-primary text-xl group-hover:scale-110 transition-transform">filter_alt</span>
          <span className="dark:text-white">Filtrar</span>
        </button>
        <button className="flex items-center gap-1.5 bg-white dark:bg-card-dark px-5 py-2.5 rounded-full shadow-sm text-sm font-bold border border-slate-50 dark:border-slate-800 group active:scale-95 transition-all">
          <span className="dark:text-white">Recientes</span>
          <span className="material-icons-round text-primary group-hover:translate-y-0.5 transition-transform">expand_more</span>
        </button>
      </div>

      <main className="px-4 space-y-8 pb-10">
        {SECTIONS.map((section, idx) => (
          <section key={idx}>
            <h2 className="text-sm font-bold text-slate-400 dark:text-slate-500 uppercase tracking-[0.15em] mb-4 ml-1">{section.title}</h2>
            <div className="space-y-4">
              {section.items.map((item) => (
                <div key={item.id} className={`bg-white dark:bg-card-dark rounded-2xl shadow-sm overflow-hidden flex border-l-4 ${item.color} transition-all active:scale-[0.99] border dark:border-slate-800`}>
                  <div className="p-4 flex gap-5 w-full relative">
                    <div className={`w-12 h-12 rounded-2xl ${item.iconColor.replace('text', 'bg').replace('-500', '-50').replace('-400', '-50')} dark:bg-slate-800/60 flex items-center justify-center shrink-0 shadow-sm`}>
                      <span className={`material-icons-round ${item.iconColor} text-2xl`}>{item.icon}</span>
                    </div>
                    <div className="flex flex-col flex-1 pr-4">
                      <p className="text-[14px] leading-snug dark:text-slate-200">
                        <span className="font-bold text-slate-900 dark:text-white">{item.title}</span> {item.detail}
                      </p>
                      <span className="text-[11px] text-slate-400 font-bold uppercase tracking-wider mt-2">{item.time}</span>
                    </div>
                    {item.unread && (
                      <div className="absolute right-5 top-5 w-2.5 h-2.5 rounded-full bg-primary shadow-[0_0_8px_rgba(242,107,58,0.5)]"></div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </section>
        ))}
      </main>
    </ProviderLayout>
  );
};

export default Notifications;
