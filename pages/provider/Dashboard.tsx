
import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import ProviderLayout from '../../components/ProviderLayout';
import { Skeleton } from '../../components/ui/Skeleton';
import { EmptyState } from '../../components/ui/EmptyState';

type Period = 'hoy' | 'esta_semana' | 'este_mes';

interface Stats {
  reservas: number;
  reservasTrend: string;
  ingresos: string;
  ingresosTrend: string;
  label: string;
  chartData: number[];
  chartLabels: string[];
  bookings: any[];
}

const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const [currentPeriod, setCurrentPeriod] = useState<Period>('este_mes');
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const filterRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const timer = setTimeout(() => setLoading(false), 1500);
    return () => clearTimeout(timer);
  }, [currentPeriod]);

  const PERIOD_DATA: Record<Period, Stats> = {
    hoy: {
      label: 'HOY',
      reservas: 3,
      reservasTrend: '+1%',
      ingresos: '$2,150',
      ingresosTrend: '-2%',
      chartData: [20, 45, 30, 80, 40, 60],
      chartLabels: ['08h', '10h', '12h', '14h', '16h', '18h'],
      bookings: [
        { id: 1, type: 'Cumpleaños', venue: 'Casa Jardín', time: '15:00 - 20:00', value: '$3,500', client: 'Laura M.', avatar: 'https://i.pravatar.cc/150?u=laura', icon: 'cake', status: 'Hoy' }
      ]
    },
    esta_semana: {
      label: 'ESTA SEMANA',
      reservas: 12,
      reservasTrend: '+5%',
      ingresos: '$18,400',
      ingresosTrend: '+4%',
      chartData: [50, 70, 40, 90, 65, 80, 95],
      chartLabels: ['LUN', 'MAR', 'MIE', 'JUE', 'VIE', 'SAB', 'DOM'],
      bookings: [
        { id: 1, type: 'Cumpleaños', venue: 'Casa Jardín', time: '15:00 - 20:00', value: '$3,500', client: 'Laura M.', avatar: 'https://i.pravatar.cc/150?u=laura', icon: 'cake', status: 'Hoy' },
        { id: 2, type: 'Boda Civil', venue: 'Terraza Panorámica', time: '12:00 - 18:00', value: '$8,200', client: 'Roberto K.', avatar: 'https://i.pravatar.cc/150?u=roberto', icon: 'favorite', status: 'Sáb' }
      ]
    },
    este_mes: {
      label: 'ESTE MES',
      reservas: 24,
      reservasTrend: '+12%',
      ingresos: '$48,350',
      ingresosTrend: '+8%',
      chartData: [40, 60, 90, 50, 75, 85],
      chartLabels: ['ENE', 'FEB', 'MAR', 'ABR', 'MAY', 'JUN'],
      bookings: [
        { id: 1, type: 'Cumpleaños', venue: 'Casa Jardín', time: '15:00 - 20:00', value: '$3,500', client: 'Laura M.', avatar: 'https://i.pravatar.cc/150?u=laura', icon: 'cake', status: 'Hoy' },
        { id: 2, type: 'Boda Civil', venue: 'Terraza Panorámica', time: '12:00 - 18:00', value: '$8,200', client: 'Roberto K.', avatar: 'https://i.pravatar.cc/150?u=roberto', icon: 'favorite', status: '15 Ago' },
        { id: 3, type: 'Corporativo', venue: 'Loft Industrial', time: '09:00 - 17:00', value: '$12,000', client: 'Empresa X', avatar: 'https://i.pravatar.cc/150?u=empresa', icon: 'business', status: '22 Ago' }
      ]
    }
  };

  const currentStats = PERIOD_DATA[currentPeriod];

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (filterRef.current && !filterRef.current.contains(event.target as Node)) {
        setIsFilterOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <ProviderLayout>
      <header className="px-6 pt-10 pb-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-14 h-14 bg-primary rounded-[20px] flex items-center justify-center text-white shadow-lg shadow-primary/20">
            <img src="https://lh3.googleusercontent.com/aida-public/AB6AXuAmRnyrCKxdTYX1OPI1gkXKrm6bpBStUidXh1dUvL7TtyAnoEkn6l2aYY3EGmilVE3oYmG8qa59XU314YhKzG38Z76XLT76133_Xu5vsOsgic0wxxY69GY7CTMUpsJOitRW0q3nRvZBN-OSmSAHENpPq_2LuZuIkx0tb_cRPVXAN-KjhUXpz-vA-pvEfXHHgU4M3DBhUQRamL-215bA-WP6yWUO6VvzxMNOqZTGL46v2-0fR0Xncgw8mYFdPsiKBmBU9opw4CQwKbfB" className="w-full h-full object-cover rounded-[20px]" alt="Host" loading="lazy" />
          </div>
          <div>
            <h1 className="text-xl font-bold leading-tight dark:text-white font-display uppercase tracking-tight">¡Hola, Carlos!</h1>
            <p className="text-sm text-slate-500 font-medium">Propietario</p>
          </div>
        </div>
        <div className="flex gap-3">
          <button 
            onClick={() => navigate('/provider/notifications')}
            className="w-11 h-11 flex items-center justify-center rounded-2xl bg-white dark:bg-surface-dark shadow-sm border border-slate-100 dark:border-slate-800 text-slate-600 dark:text-slate-300 transition-colors"
          >
            <span className="material-icons-round">notifications_none</span>
          </button>
          <button
            onClick={() => navigate('/provider/profile')}
            className="w-11 h-11 flex items-center justify-center rounded-2xl bg-white dark:bg-surface-dark shadow-sm border border-slate-100 dark:border-slate-800 text-slate-600 dark:text-slate-300 transition-colors"
          >
            <span className="material-icons-round">account_circle</span>
          </button>
        </div>
      </header>

      <div className="px-5 space-y-8">
        <section>
          <div className="flex items-center justify-between mb-5 px-1 relative">
            <h2 className="text-lg font-bold dark:text-white font-display uppercase tracking-tight">Resumen</h2>
            <div ref={filterRef} className="relative">
              <button 
                onClick={() => setIsFilterOpen(!isFilterOpen)}
                className="text-xs font-bold text-secondary flex items-center gap-1 uppercase tracking-wider transition-all active:scale-95 py-2"
              >
                {currentStats.label} <span className="material-icons-round text-sm transition-transform duration-300" style={{ transform: isFilterOpen ? 'rotate(180deg)' : 'rotate(0)' }}>expand_more</span>
              </button>
              
              {isFilterOpen && (
                <div className="absolute right-0 top-10 w-44 bg-white dark:bg-slate-800 rounded-2xl shadow-2xl border border-slate-100 dark:border-slate-700 z-[100] py-2 animate-in fade-in slide-in-from-top-2 duration-300">
                  {(Object.keys(PERIOD_DATA) as Period[]).map((p) => (
                    <button
                      key={p}
                      onClick={() => {
                        setCurrentPeriod(p);
                        setIsFilterOpen(false);
                        setLoading(true);
                      }}
                      className={`w-full px-5 py-3 text-left text-xs font-bold transition-colors uppercase tracking-widest ${currentPeriod === p ? 'text-primary bg-primary/5' : 'text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700/50'}`}
                    >
                      {PERIOD_DATA[p].label}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
          {loading ? (
            <div className="grid grid-cols-2 gap-4">
              <Skeleton className="h-32 rounded-[32px]" />
              <Skeleton className="h-32 rounded-[32px]" />
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-4">
              <div 
                onClick={() => navigate('/provider/received-bookings')}
                className="bg-white dark:bg-surface-dark p-6 rounded-[32px] shadow-sm border border-slate-100 dark:border-slate-800 relative overflow-hidden group cursor-pointer active:scale-[0.98] transition-all"
              >
                <div className="flex justify-between items-start mb-4">
                  <div className="w-10 h-10 rounded-2xl bg-orange-50 dark:bg-orange-900/20 flex items-center justify-center text-primary group-hover:scale-110 transition-transform">
                    <span className="material-icons-round">calendar_today</span>
                  </div>
                  <span className={`text-[10px] font-bold px-2 py-1 rounded-full ${currentStats.reservasTrend.startsWith('+') ? 'text-emerald-500 bg-emerald-50 dark:bg-emerald-950/20' : 'text-rose-500 bg-rose-50 dark:bg-rose-950/20'}`}>
                    {currentStats.reservasTrend}
                  </span>
                </div>
                <p className="text-slate-400 text-[11px] font-bold uppercase tracking-wider mb-1">Reservas</p>
                <p className="text-3xl font-bold dark:text-white transition-all duration-500 tabular-nums">{currentStats.reservas}</p>
              </div>
              <div 
                onClick={() => navigate('/provider/stats')}
                className="bg-white dark:bg-surface-dark p-6 rounded-[32px] shadow-sm border border-slate-100 dark:border-slate-800 relative overflow-hidden group cursor-pointer active:scale-[0.98] transition-all"
              >
                <div className="flex justify-between items-start mb-4">
                  <div className="w-10 h-10 rounded-2xl bg-cyan-50 dark:bg-cyan-900/20 flex items-center justify-center text-secondary group-hover:scale-110 transition-transform">
                    <span className="material-icons-round">payments</span>
                  </div>
                  <span className={`text-[10px] font-bold px-2 py-1 rounded-full ${currentStats.ingresosTrend.startsWith('+') ? 'text-emerald-500 bg-emerald-50 dark:bg-emerald-950/20' : 'text-rose-500 bg-rose-50 dark:bg-rose-950/20'}`}>
                    {currentStats.ingresosTrend}
                  </span>
                </div>
                <p className="text-slate-400 text-[11px] font-bold uppercase tracking-wider mb-1">Ingresos</p>
                <p className="text-2xl font-bold dark:text-white transition-all duration-500 tabular-nums">{currentStats.ingresos}</p>
              </div>
            </div>
          )}
        </section>

        <section className="bg-white dark:bg-surface-dark p-7 rounded-[40px] shadow-sm border border-slate-100 dark:border-slate-800">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-lg font-bold dark:text-white font-display uppercase tracking-tight">Ingresos</h2>
            <button onClick={() => navigate('/provider/stats')} className="text-xs font-bold text-secondary uppercase tracking-widest">Ver todo</button>
          </div>
          <div className="h-44 w-full relative mb-10">
            {loading ? (
              <Skeleton className="h-full w-full rounded-2xl" />
            ) : (
              <>
                <div className="absolute inset-0 flex items-end justify-between px-2">
                  {currentStats.chartData.map((h, i) => (
                    <div key={i} className="w-8 bg-primary/20 rounded-t-lg relative group h-full">
                      <div className="absolute bottom-0 inset-x-0 bg-primary rounded-t-lg transition-all duration-1000 group-hover:h-full" style={{ height: `${h}%` }}></div>
                    </div>
                  ))}
                </div>
                <div className="absolute bottom-[-30px] inset-x-0 flex justify-between text-[10px] text-slate-400 font-bold uppercase tracking-widest">
                  {currentStats.chartLabels.map((label, i) => (
                    <span key={i}>{label}</span>
                  ))}
                </div>
              </>
            )}
          </div>
          <div className="grid grid-cols-3 gap-2 border-t dark:border-slate-800 pt-8 mt-6">
            <div className="text-center">
              <p className="text-[10px] text-slate-400 uppercase font-bold tracking-widest mb-1.5">Este mes</p>
              <p className="text-sm font-bold text-primary font-display">$12,580</p>
            </div>
            <div className="text-center border-x dark:border-slate-800">
              <p className="text-[10px] text-slate-400 uppercase font-bold tracking-widest mb-1.5">Próximo</p>
              <p className="text-sm font-bold text-secondary font-display">$15,200</p>
            </div>
            <div className="text-center">
              <p className="text-[10px] text-slate-400 uppercase font-bold tracking-widest mb-1.5">Promedio</p>
              <p className="text-sm font-bold dark:text-white font-display">$13,450</p>
            </div>
          </div>
        </section>

        <section className="pb-8">
          <div className="flex items-center justify-between mb-6 px-1">
            <h2 className="text-lg font-bold dark:text-white font-display uppercase tracking-tight">Próximas reservas</h2>
            <button onClick={() => navigate('/provider/received-bookings')} className="text-xs font-bold text-secondary uppercase tracking-widest">Ver todas</button>
          </div>
          {loading ? (
            <div className="space-y-4">
              <Skeleton className="h-32 rounded-[36px]" />
              <Skeleton className="h-32 rounded-[36px]" />
            </div>
          ) : currentStats.bookings.length === 0 ? (
            <EmptyState 
              icon="event_busy"
              title="Sin reservas"
              description="Aún no tienes reservas para este periodo."
              action={{ label: 'Ver calendario', onClick: () => navigate('/provider/calendar') }}
            />
          ) : (
            <div className="space-y-4">
              {currentStats.bookings.map((booking) => (
                <div key={booking.id} className="bg-white dark:bg-surface-dark p-6 rounded-[36px] shadow-sm border border-slate-100 dark:border-slate-800 group active:scale-[0.99] transition-all cursor-pointer">
                  <div className="flex justify-between items-start mb-6">
                    <div className="flex gap-4">
                      <div className="w-14 h-14 bg-orange-50 dark:bg-orange-900/20 rounded-2xl flex items-center justify-center text-primary">
                        <span className="material-icons-round text-3xl">{booking.icon}</span>
                      </div>
                      <div>
                        <h3 className="font-bold text-lg dark:text-white tracking-tight uppercase">{booking.type}</h3>
                        <p className="text-xs text-slate-400 font-bold uppercase tracking-wider">{booking.venue}</p>
                      </div>
                    </div>
                    <span className="bg-orange-100 dark:bg-orange-900/40 text-primary text-[10px] font-bold px-4 py-2 rounded-xl uppercase tracking-widest animate-pulse">{booking.status}</span>
                  </div>
                  <div className="grid grid-cols-3 gap-6 border-t dark:border-slate-800 pt-6">
                    <div>
                      <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mb-2">Cliente</p>
                      <div className="flex items-center gap-2">
                        <img src={booking.avatar} className="w-6 h-6 rounded-full" alt="User" loading="lazy" />
                        <span className="text-[11px] font-bold dark:text-slate-200 truncate">{booking.client}</span>
                      </div>
                    </div>
                    <div>
                      <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mb-2">Horario</p>
                      <p className="text-[11px] font-bold dark:text-slate-200">{booking.time}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mb-2">Valor</p>
                      <p className="text-[11px] font-bold text-primary">{booking.value}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </ProviderLayout>
  );
};

export default Dashboard;
