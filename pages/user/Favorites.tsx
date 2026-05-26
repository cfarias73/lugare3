
import React, { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../../components/Layout';
import { useUser } from '../../context/UserContext';
import { EmptyState } from '../../components/ui/EmptyState';
import { getVenuesByIds } from '../../src/services/venueService';
import { Venue } from '../../types';

const Favorites: React.FC = () => {
  const navigate = useNavigate();
  const { favorites, toggleFavorite } = useUser();
  const [activeTab, setActiveTab] = useState<'espacios' | 'colecciones'>('espacios');
  const [query, setQuery] = useState('');
  const [favoriteVenues, setFavoriteVenues] = useState<Venue[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    getVenuesByIds(favorites).then((v) => {
      setFavoriteVenues(v);
      setLoading(false);
    });
  }, [favorites]);

  const visibleVenues = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return favoriteVenues;
    return favoriteVenues.filter((v) =>
      v.name.toLowerCase().includes(q) ||
      v.location.toLowerCase().includes(q) ||
      (v.city || '').toLowerCase().includes(q)
    );
  }, [favoriteVenues, query]);

  return (
    <Layout>
      <header className="sticky top-0 z-30 bg-white/80 dark:bg-background-dark/80 backdrop-blur-md px-4 pt-12 pb-2">
        <div className="flex items-center justify-between mb-4">
          <button onClick={() => navigate(-1)} className="p-2 -ml-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
            <span className="material-icons-outlined">arrow_back</span>
          </button>
          <h1 className="text-xl font-bold font-display">Favoritos</h1>
          <div className="w-9" />
        </div>
        <div className="flex border-b border-slate-100 dark:border-slate-800">
          <button
            onClick={() => setActiveTab('espacios')}
            className={`flex-1 py-3 text-sm font-semibold transition-all ${activeTab === 'espacios' ? 'text-primary border-b-2 border-primary' : 'text-slate-400'}`}
          >
            Espacios ({favoriteVenues.length})
          </button>
          <button
            onClick={() => setActiveTab('colecciones')}
            className={`flex-1 py-3 text-sm font-semibold transition-all ${activeTab === 'colecciones' ? 'text-primary border-b-2 border-primary' : 'text-slate-400'}`}
          >
            Colecciones
          </button>
        </div>
      </header>

      <main className="px-4 mt-4 space-y-6 pb-8">
        {activeTab === 'espacios' ? (
          <>
            <div className="relative">
              <span className="material-icons-outlined absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">search</span>
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="w-full pl-12 pr-4 py-3 bg-slate-100 dark:bg-slate-800 border-none rounded-2xl focus:ring-2 focus:ring-primary/50 text-sm"
                placeholder="Buscar en favoritos"
                type="text"
              />
            </div>

            {favoriteVenues.length === 0 ? (
              <EmptyState
                icon="favorite_border"
                title="Aún no tienes favoritos"
                description="Pulsa el corazón en cualquier espacio para guardarlo aquí."
                action={{ label: 'Explorar espacios', onClick: () => navigate('/user/home') }}
              />
            ) : visibleVenues.length === 0 ? (
              <p className="text-center text-sm text-slate-500 py-8">No hay resultados para "{query}".</p>
            ) : (
              <div className="space-y-6">
                {visibleVenues.map((venue) => (
                  <div
                    key={venue.id}
                    onClick={() => navigate(`/user/venue/${venue.id}`)}
                    className="bg-white dark:bg-surface-dark rounded-xl overflow-hidden shadow-sm border border-slate-100 dark:border-slate-800 cursor-pointer"
                  >
                    <div className="relative h-56 overflow-hidden">
                      <img alt={venue.name} className="w-full h-full object-cover" src={venue.image} />
                      <button
                        onClick={(e) => { e.stopPropagation(); toggleFavorite(venue.id); }}
                        className="absolute top-4 right-4 bg-white p-2 rounded-full shadow-lg hover:scale-105 transition-transform"
                        aria-label="Quitar de favoritos"
                      >
                        <span className="material-icons-outlined text-primary text-xl">favorite</span>
                      </button>
                      {venue.isFeatured && (
                        <div className="absolute bottom-4 right-4 bg-yellow-400 text-white text-xs font-bold px-3 py-1.5 rounded-full shadow-md">
                          Destacado
                        </div>
                      )}
                    </div>
                    <div className="p-4">
                      <div className="flex justify-between items-start mb-1">
                        <h3 className="font-bold text-lg font-display">{venue.name}</h3>
                        <div className="flex items-center gap-1 bg-slate-50 dark:bg-slate-800 px-2 py-0.5 rounded-lg">
                          <span className="material-icons-outlined text-yellow-500 text-sm">star</span>
                          <span className="text-sm font-semibold">{venue.rating}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-1 text-slate-500 dark:text-slate-400 text-sm mb-3">
                        <span className="material-icons-outlined text-primary text-base">location_on</span>
                        {venue.location}
                      </div>
                      <div className="flex justify-between items-center mb-4">
                        <div className="flex items-center gap-2 text-slate-500 text-sm">
                          <span className="material-icons-outlined text-base">groups</span>
                          Hasta {venue.capacity} personas
                        </div>
                        <div className="text-primary font-bold text-xl">${venue.price.toLocaleString()}</div>
                      </div>
                      <button
                        onClick={(e) => { e.stopPropagation(); toggleFavorite(venue.id); }}
                        className="w-full py-2.5 rounded-xl text-sm font-semibold border border-red-200 dark:border-red-900/40 text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors flex items-center justify-center gap-2"
                      >
                        <span className="material-icons-outlined text-base">heart_broken</span>
                        Quitar de favoritos
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        ) : (
          <EmptyState
            icon="collections_bookmark"
            title="Colecciones próximamente"
            description="Pronto podrás organizar tus favoritos en colecciones personalizadas."
          />
        )}
      </main>
    </Layout>
  );
};

export default Favorites;
