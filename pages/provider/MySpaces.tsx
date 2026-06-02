
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import ProviderLayout from '../../components/ProviderLayout';
import { useUser } from '../../context/UserContext';
import { getProviderVenues } from '../../src/services/providerService';

const MySpaces: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useUser();
  const [loading, setLoading] = useState(true);
  const [venues, setVenues] = useState<any[]>([]);

  useEffect(() => {
    if (user?.id) {
      setLoading(true);
      getProviderVenues(user.id).then(data => {
        setVenues(data.map(v => ({
          id: v.id,
          name: v.name,
          location: v.location,
          cap: v.capacity,
          price: v.price_per_hour,
          img: v.venue_images && v.venue_images.length > 0 ? v.venue_images[0].image_url : 'https://images.unsplash.com/photo-1519167758481-83f5e181dcc3?auto=format&fit=crop&q=80&w=800',
          active: v.status === 'approved',
          popular: v.is_featured
        })));
        setLoading(false);
      });
    }
  }, [user]);

  const toggleActive = (id: number) => {
    setVenues(prev => prev.map(v => v.id === id ? { ...v, active: !v.active } : v));
  };

  const editVenue = (id: number) => {
    navigate(`/provider/create-space?id=${id}`);
  };

  return (
    <ProviderLayout>
      <div className="flex gap-4 px-6 py-2 overflow-x-auto no-scrollbar">
        <div className="min-w-[110px] flex-1 bg-white dark:bg-surface-dark p-5 rounded-[28px] shadow-sm border border-slate-100 dark:border-slate-800">
          <div className="w-8 h-8 rounded-xl bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center text-primary mb-4">
            <span className="material-icons-round text-sm">location_on</span>
          </div>
          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mb-1">Total</p>
          <p className="text-2xl font-bold dark:text-white">8</p>
        </div>
        <div className="min-w-[110px] flex-1 bg-white dark:bg-surface-dark p-5 rounded-[28px] shadow-sm border border-slate-100 dark:border-slate-800">
          <div className="w-8 h-8 rounded-xl bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center text-emerald-500 mb-4">
            <span className="material-icons-round text-sm">check_circle</span>
          </div>
          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mb-1">Activos</p>
          <p className="text-2xl font-bold dark:text-white">6</p>
        </div>
        <div className="min-w-[110px] flex-1 bg-white dark:bg-surface-dark p-5 rounded-[28px] shadow-sm border border-slate-100 dark:border-slate-800">
          <div className="w-8 h-8 rounded-xl bg-slate-100 dark:bg-slate-700 flex items-center justify-center text-slate-400 mb-4">
            <span className="material-icons-round text-sm">pause_circle_filled</span>
          </div>
          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mb-1">Inactivos</p>
          <p className="text-2xl font-bold dark:text-white">2</p>
        </div>
      </div>

      <div className="px-6 py-8">
        <div className="relative group">
          <span className="material-icons-round absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-primary transition-colors">search</span>
          <input 
            className="w-full pl-14 pr-6 py-4 bg-white dark:bg-surface-dark border-none rounded-[22px] shadow-sm focus:ring-4 focus:ring-primary/10 placeholder:text-slate-400 text-sm font-medium transition-all" 
            placeholder="Buscar por nombre o ubicación..." 
            type="text"
          />
        </div>
      </div>

      <section className="px-6">
        <div className="flex items-center justify-between mb-6 px-1">
          <h2 className="text-lg font-bold dark:text-white tracking-tight">Todos los espacios</h2>
          <button className="flex items-center text-sm font-bold text-secondary uppercase tracking-wider">
            Más recientes <span className="material-icons-round text-sm ml-1">expand_more</span>
          </button>
        </div>

        {loading ? (
          <div className="space-y-8 pb-10">
            {[1, 2].map((i) => (
              <div key={i} className="bg-white dark:bg-surface-dark rounded-[36px] overflow-hidden shadow-sm border border-slate-100 dark:border-slate-800 animate-pulse">
                <div className="h-56 bg-slate-200 dark:bg-slate-700" />
                <div className="p-6 space-y-4">
                  <div className="h-6 bg-slate-200 dark:bg-slate-700 rounded w-3/4" />
                  <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-1/2" />
                  <div className="h-8 bg-slate-200 dark:bg-slate-700 rounded w-full" />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="space-y-8 pb-10">
            {venues.map((venue) => (
              <div key={venue.id} className="bg-white dark:bg-surface-dark rounded-[36px] overflow-hidden shadow-sm border border-slate-100 dark:border-slate-800 transition-all hover:shadow-xl hover:translate-y-[-4px]">
                <div className="relative h-56">
                  <img alt={venue.name} className="w-full h-full object-cover" src={venue.img} />
                  {venue.popular && (
                    <div className="absolute top-5 left-5 bg-primary text-white text-[10px] font-bold px-4 py-1.5 rounded-full uppercase tracking-widest shadow-lg shadow-primary/30">Popular</div>
                  )}
                  <button 
                    onClick={() => toggleActive(venue.id)}
                    className={`absolute top-5 right-5 ${venue.active ? 'bg-emerald-500' : 'bg-slate-500'} text-white text-[10px] font-bold px-4 py-1.5 rounded-full flex items-center gap-2 shadow-lg hover:scale-105 transition-all`}
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse"></span> {venue.active ? 'Activo' : 'Inactivo'}
                  </button>
                </div>
                <div className="p-6">
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="text-xl font-bold dark:text-white tracking-tight">{venue.name}</h3>
                    <div className="flex items-center gap-1.5">
                      <span className="material-icons-round text-amber-400 text-lg">star</span>
                      <span className="text-sm font-bold dark:text-slate-200">4.8</span>
                    </div>
                  </div>
                  <p className="text-sm text-slate-500 font-medium mb-6">{venue.location} • Capacidad: {venue.cap} personas</p>
                  <div className="flex items-center justify-between">
                    <p className="text-primary font-bold text-xl">${venue.price.toLocaleString()} <span className="text-xs font-medium text-slate-400">/ hora</span></p>
                    <div className="flex gap-2">
                      <button 
                        onClick={() => navigate(`/provider/calendar?venueId=${venue.id}`)}
                        className="w-12 h-12 rounded-[18px] bg-cyan-50 dark:bg-cyan-900/20 text-secondary flex items-center justify-center hover:bg-secondary hover:text-white transition-all shadow-sm active:scale-95"
                      >
                        <span className="material-icons-round text-xl">event</span>
                      </button>
                      <button 
                        onClick={() => editVenue(venue.id)}
                        className="w-12 h-12 rounded-[18px] bg-slate-50 dark:bg-slate-700 text-slate-400 flex items-center justify-center hover:bg-slate-200 transition-all shadow-sm active:scale-95"
                      >
                        <span className="material-icons-round text-xl">edit</span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* FAB Position Adjusted */}
      <div className="fixed bottom-[100px] inset-x-0 max-w-md mx-auto px-6 z-50 pointer-events-none flex justify-end">
        <button 
          onClick={() => navigate('/provider/create-space')}
          className="w-16 h-16 bg-primary text-white rounded-[24px] shadow-2xl shadow-primary/40 flex items-center justify-center hover:scale-110 active:scale-95 transition-all pointer-events-auto"
        >
          <span className="material-icons-round text-4xl">add</span>
        </button>
      </div>
    </ProviderLayout>
  );
};

export default MySpaces;
