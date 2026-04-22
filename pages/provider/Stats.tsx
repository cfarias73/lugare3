
import React from 'react';
import { useNavigate } from 'react-router-dom';
import ProviderLayout from '../../components/ProviderLayout';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

const Stats: React.FC = () => {
  const navigate = useNavigate();

  const trendData = [
    { name: 'Ene', value: 40 },
    { name: 'Feb', value: 30 },
    { name: 'Mar', value: 50 },
    { name: 'Abr', value: 40 },
    { name: 'May', value: 70 },
    { name: 'Jun', value: 60 },
    { name: 'Jul', value: 80 },
  ];

  const trafficData = [
    { name: 'Directa', value: 400 },
    { name: 'Social', value: 300 },
    { name: 'Recomendaciones', value: 200 },
    { name: 'Otros', value: 100 },
  ];
  const COLORS = ['#F26B3A', '#00A8B5', '#FFB82E', '#CBD5E1'];

  return (
    <ProviderLayout>
      <header className="sticky top-0 z-50 bg-white dark:bg-card-dark px-4 pt-10 pb-3 flex items-center justify-between shadow-sm transition-colors">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate(-1)} className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full">
            <span className="material-icons-round text-slate-700 dark:text-slate-300">arrow_back</span>
          </button>
          <h1 className="text-xl font-bold dark:text-white font-display tracking-tight">Estadísticas</h1>
        </div>
        <button className="p-2 text-secondary">
          <span className="material-icons-round">filter_alt</span>
        </button>
      </header>

      <div className="bg-white dark:bg-card-dark flex border-b border-slate-100 dark:border-slate-800">
        <button className="flex-1 py-3 text-sm font-bold border-b-2 border-primary text-primary">Básicas</button>
        <button className="flex-1 py-3 text-sm font-bold text-slate-400 dark:text-slate-500">Avanzadas</button>
      </div>

      <main className="p-4 space-y-6 pb-12">
        {/* Month Selector */}
        <div className="bg-white dark:bg-slate-800 p-4 rounded-2xl flex items-center justify-between shadow-sm border border-slate-50 dark:border-slate-700">
          <button className="p-1.5 rounded-full text-secondary hover:bg-secondary/10 transition-colors">
            <span className="material-icons-round">chevron_left</span>
          </button>
          <div className="text-center">
            <p className="font-bold text-slate-800 dark:text-white tracking-tight">Julio 2023</p>
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-0.5">Comparado con <span className="text-secondary">Junio 2023</span></p>
          </div>
          <button className="p-1.5 rounded-full text-secondary hover:bg-secondary/10 transition-colors">
            <span className="material-icons-round">chevron_right</span>
          </button>
        </div>

        {/* High-level cards */}
        <section>
          <h2 className="text-sm font-bold mb-3 text-slate-700 dark:text-slate-300 uppercase tracking-[0.1em]">Reservas mensuales</h2>
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-white dark:bg-slate-800 p-5 rounded-3xl shadow-sm border border-slate-50 dark:border-slate-700">
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mb-1">Total reservas</p>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-bold dark:text-white">24</span>
                <span className="text-[10px] text-emerald-500 font-bold flex items-center bg-emerald-50 dark:bg-emerald-950/30 px-1.5 py-0.5 rounded-lg">
                  <span className="material-icons-round text-[12px] mr-0.5">arrow_upward</span> 12%
                </span>
              </div>
            </div>
            <div className="bg-white dark:bg-slate-800 p-5 rounded-3xl shadow-sm border border-slate-50 dark:border-slate-700">
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mb-1">Completadas</p>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-bold dark:text-white">18</span>
                <span className="text-[10px] text-emerald-500 font-bold flex items-center bg-emerald-50 dark:bg-emerald-950/30 px-1.5 py-0.5 rounded-lg">
                  <span className="material-icons-round text-[12px] mr-0.5">arrow_upward</span> 8%
                </span>
              </div>
            </div>
          </div>
        </section>

        {/* Booking Trend Chart */}
        <section className="bg-white dark:bg-slate-800 p-6 rounded-[36px] shadow-sm border border-slate-50 dark:border-slate-700">
          <div className="flex justify-between items-center mb-8">
            <h3 className="text-sm font-bold dark:text-white tracking-tight">Tendencia de reservas</h3>
          </div>
          <div className="h-44 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={trendData}>
                <XAxis dataKey="name" hide />
                <YAxis hide />
                <Tooltip />
                <Line type="monotone" dataKey="value" stroke="#F26B3A" strokeWidth={3} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </section>

        {/* Top Spaces */}
        <section className="bg-white dark:bg-slate-800 p-6 rounded-[36px] shadow-sm border border-slate-50 dark:border-slate-700">
          <h3 className="text-sm font-bold mb-6 dark:text-white tracking-tight">Espacios más reservados</h3>
          <div className="space-y-6">
            {[
              { rank: 1, name: 'Casa con jardín', count: 8, trend: '+20%', color: 'bg-primary', iconTrend: 'arrow_upward', trendColor: 'text-emerald-500' },
              { rank: 2, name: 'Loft industrial', count: 6, trend: '+5%', color: 'bg-secondary', iconTrend: 'arrow_upward', trendColor: 'text-emerald-500' },
              { rank: 3, name: 'Terraza con piscina', count: 5, trend: '-10%', color: 'bg-amber-400', iconTrend: 'arrow_downward', trendColor: 'text-rose-500' },
            ].map((space) => (
              <div key={space.rank} className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className={`w-11 h-11 ${space.color} text-white flex items-center justify-center rounded-[18px] font-bold text-lg shadow-sm`}>{space.rank}</div>
                  <div>
                    <p className="text-[15px] font-bold dark:text-white tracking-tight leading-tight">{space.name}</p>
                    <p className="text-[11px] text-slate-400 font-medium">{space.count} reservas</p>
                  </div>
                </div>
                <span className={`text-[11px] ${space.trendColor} font-bold flex items-center bg-slate-50 dark:bg-slate-900/40 px-2 py-1 rounded-full`}>
                  <span className="material-icons-round text-sm mr-0.5">{space.iconTrend}</span> {space.trend}
                </span>
              </div>
            ))}
          </div>
        </section>

        {/* Financial Cards */}
        <section>
          <h2 className="text-sm font-bold mb-3 text-slate-700 dark:text-slate-300 uppercase tracking-[0.1em]">Ingresos y visitas</h2>
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-white dark:bg-slate-800 p-5 rounded-3xl shadow-sm border border-slate-50 dark:border-slate-700">
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mb-1">Ingresos totales</p>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-bold dark:text-white">$4,250</span>
                <span className="text-[10px] text-emerald-500 font-bold flex items-center bg-emerald-50 dark:bg-emerald-950/30 px-1.5 py-0.5 rounded-lg">
                  <span className="material-icons-round text-[12px] mr-0.5">arrow_upward</span> 15%
                </span>
              </div>
            </div>
            <div className="bg-white dark:bg-slate-800 p-5 rounded-3xl shadow-sm border border-slate-50 dark:border-slate-700">
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mb-1">Visitas a espacios</p>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-bold dark:text-white">356</span>
                <span className="text-[10px] text-emerald-500 font-bold flex items-center bg-emerald-50 dark:bg-emerald-950/30 px-1.5 py-0.5 rounded-lg">
                  <span className="material-icons-round text-[12px] mr-0.5">arrow_upward</span> 22%
                </span>
              </div>
            </div>
          </div>
        </section>

        {/* Traffic Sources */}
        <section className="bg-white dark:bg-slate-800 p-8 rounded-[40px] shadow-sm border border-slate-50 dark:border-slate-700">
          <h3 className="text-sm font-bold mb-8 dark:text-white text-center uppercase tracking-widest">Fuentes de tráfico</h3>
          <div className="flex flex-col items-center">
            <div className="h-44 w-full mb-10">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={trafficData} innerRadius={50} outerRadius={70} paddingAngle={5} dataKey="value">
                    {trafficData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="grid grid-cols-2 gap-x-8 gap-y-4 w-full">
              {trafficData.map((src, i) => (
                <div key={i} className="flex items-center gap-3">
                  <div className="w-3 h-3 rounded-full shadow-sm" style={{ backgroundColor: COLORS[i] }}></div>
                  <span className="text-[11px] font-bold text-slate-600 dark:text-slate-400 whitespace-nowrap tracking-tight">{src.name}</span>
                </div>
              ))}
            </div>
          </div>
        </section>
      </main>
    </ProviderLayout>
  );
};

export default Stats;
