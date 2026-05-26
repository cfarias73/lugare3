
import React, { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../../components/Layout';
import { getVenues } from '../../src/services/venueService';
import { Venue } from '../../types';
import { MapContainer, TileLayer, Marker, useMap } from 'react-leaflet';
import L from 'leaflet';

// Fix for default marker icon in Leaflet + React
// @ts-ignore
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

// Component to handle map center and zoom
const MapController: React.FC<{ center: [number, number], zoom: number }> = ({ center, zoom }) => {
  const map = useMap();
  
  useEffect(() => {
    map.setView(center, zoom);
    // Force a resize check to ensure tiles load correctly
    setTimeout(() => {
      map.invalidateSize();
    }, 100);
  }, [center, zoom, map]);
  
  return null;
};

type PriceRange = { label: string; min: number; max: number };
type CapacityRange = { label: string; min: number; max: number };

const PRICE_RANGES: PriceRange[] = [
  { label: 'Hasta $20,000', min: 0, max: 20000 },
  { label: '$20,000 - $50,000', min: 20000, max: 50000 },
  { label: '$50,000 - $100,000', min: 50000, max: 100000 },
  { label: 'Más de $100,000', min: 100000, max: Infinity },
];

const CAPACITY_RANGES: CapacityRange[] = [
  { label: 'Hasta 50 personas', min: 0, max: 50 },
  { label: '50 - 100 personas', min: 50, max: 100 },
  { label: '100 - 300 personas', min: 100, max: 300 },
  { label: 'Más de 300 personas', min: 300, max: Infinity },
];

const RATING_OPTIONS = [3, 3.5, 4, 4.5];

const ExploreMap: React.FC = () => {
  const navigate = useNavigate();
  const [selectedVenue, setSelectedVenue] = useState<Venue | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [openFilter, setOpenFilter] = useState<string | null>(null);
  const [priceRange, setPriceRange] = useState<PriceRange | null>(null);
  const [capacityRange, setCapacityRange] = useState<CapacityRange | null>(null);
  const [dateFilter, setDateFilter] = useState<string>('');
  const [minRating, setMinRating] = useState<number | null>(null);
  const [mapCenter, setMapCenter] = useState<[number, number]>([19.4326, -99.1332]);
  const [zoom, setZoom] = useState(13);
  const [venues, setVenues] = useState<Venue[]>([]);
  const [userLocation, setUserLocation] = useState<[number, number] | null>(null);
  const [locating, setLocating] = useState(false);
  const [locationError, setLocationError] = useState<string | null>(null);

  useEffect(() => {
    const fetchVenues = async () => {
      const data = await getVenues();
      setVenues(data);
    };
    fetchVenues();
  }, []);

  const requestLocation = React.useCallback(() => {
    if (!navigator.geolocation) {
      setLocationError('Geolocalización no soportada en este navegador');
      return;
    }
    setLocating(true);
    setLocationError(null);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const coords: [number, number] = [pos.coords.latitude, pos.coords.longitude];
        setUserLocation(coords);
        setMapCenter(coords);
        setZoom(14);
        setLocating(false);
      },
      (err) => {
        console.warn('Geolocation error:', err);
        setLocationError(
          err.code === err.PERMISSION_DENIED
            ? 'Permiso de ubicación denegado. Actívalo en tu navegador.'
            : 'No se pudo obtener tu ubicación'
        );
        setLocating(false);
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 }
    );
  }, []);

  useEffect(() => {
    requestLocation();
  }, [requestLocation]);

  const filteredVenues = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return venues.filter(venue => {
      if (q) {
        const matches =
          venue.name.toLowerCase().includes(q) ||
          venue.location.toLowerCase().includes(q) ||
          (venue.city || '').toLowerCase().includes(q);
        if (!matches) return false;
      }
      if (priceRange && (venue.price < priceRange.min || venue.price > priceRange.max)) return false;
      if (capacityRange && (venue.capacity < capacityRange.min || venue.capacity > capacityRange.max)) return false;
      if (minRating != null && (venue.rating || 0) < minRating) return false;
      return true;
    });
  }, [venues, searchQuery, priceRange, capacityRange, minRating]);

  const activeFilterCount =
    (priceRange ? 1 : 0) + (capacityRange ? 1 : 0) + (dateFilter ? 1 : 0) + (minRating != null ? 1 : 0);

  const clearAllFilters = () => {
    setPriceRange(null);
    setCapacityRange(null);
    setDateFilter('');
    setMinRating(null);
    setOpenFilter(null);
  };

  const chipClass = (active: boolean) =>
    `flex-shrink-0 flex items-center gap-1.5 px-4 py-2 rounded-full font-semibold text-sm shadow-sm transition-colors border ${
      active
        ? 'bg-primary text-white border-primary shadow-primary/20'
        : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-200 dark:hover:bg-slate-700'
    }`;


  // Update map center when a venue is selected
  useEffect(() => {
    if (selectedVenue) {
      setMapCenter([selectedVenue.lat, selectedVenue.lng]);
      setZoom(15);
    }
  }, [selectedVenue]);

  const customIcon = (price: number, isSelected: boolean) => L.divIcon({
    className: 'custom-div-icon',
    html: `<div class="px-3 py-1.5 rounded-xl border font-bold text-sm shadow-sm transition-all transform ${isSelected ? 'bg-primary border-white text-white scale-110 z-[1000]' : 'bg-white border-slate-100 text-primary'}">$${price.toLocaleString()}</div>`,
    iconSize: [60, 30],
    iconAnchor: [30, 15]
  });

  return (
    <Layout>
      <div className="flex flex-col h-full bg-white dark:bg-slate-900 relative transition-colors flex-1 overflow-hidden">
        <header className="pt-12 pb-4 px-4 bg-white dark:bg-slate-900 z-20 transition-colors shadow-sm">
          <div className="flex items-center justify-between mb-5">
            <h1 className="text-xl font-bold text-slate-800 dark:text-white font-display">Explorar</h1>
            {activeFilterCount > 0 && (
              <span className="text-xs font-semibold text-primary bg-primary/10 px-3 py-1 rounded-full">
                {activeFilterCount} {activeFilterCount === 1 ? 'filtro activo' : 'filtros activos'}
              </span>
            )}
          </div>
          
          <div className="relative mb-4">
            <div className="flex items-center bg-slate-100 dark:bg-slate-800 rounded-2xl p-4 gap-3">
              <span className="material-icons-round text-slate-400">search</span>
              <input 
                className="bg-transparent border-none focus:ring-0 w-full text-sm text-slate-700 dark:text-slate-200 placeholder:text-slate-400" 
                placeholder="¿Dónde quieres celebrar tu evento?" 
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              <button
                onClick={requestLocation}
                disabled={locating}
                title="Usar mi ubicación"
                className="bg-primary text-white p-2 rounded-xl flex items-center justify-center shadow-md hover:bg-orange-600 transition-colors disabled:opacity-60"
              >
                <span className={`material-icons-round text-lg ${locating ? 'animate-pulse' : ''}`}>near_me</span>
              </button>
            </div>
          </div>

          <div className="relative">
            <div className="flex gap-2 overflow-x-auto pb-2 no-scrollbar">
              <button
                onClick={() => setOpenFilter(openFilter === 'price' ? null : 'price')}
                className={chipClass(priceRange !== null)}
              >
                <span>{priceRange ? priceRange.label : 'Precio'}</span>
                <span className="material-icons-round text-sm">expand_more</span>
              </button>
              <button
                onClick={() => setOpenFilter(openFilter === 'capacity' ? null : 'capacity')}
                className={chipClass(capacityRange !== null)}
              >
                <span>{capacityRange ? capacityRange.label : 'Capacidad'}</span>
                <span className="material-icons-round text-sm">expand_more</span>
              </button>
              <button
                onClick={() => setOpenFilter(openFilter === 'date' ? null : 'date')}
                className={chipClass(!!dateFilter)}
              >
                <span className="material-icons-round text-sm">event</span>
                <span>{dateFilter ? new Date(dateFilter + 'T00:00:00').toLocaleDateString('es-MX', { day: 'numeric', month: 'short' }) : 'Fecha'}</span>
              </button>
              <button
                onClick={() => setOpenFilter(openFilter === 'rating' ? null : 'rating')}
                className={chipClass(minRating !== null)}
              >
                <span className="material-icons-round text-amber-400 text-sm">star</span>
                <span>{minRating != null ? `${minRating}+` : 'Calificación'}</span>
              </button>
              {activeFilterCount > 0 && (
                <button
                  onClick={clearAllFilters}
                  className="flex-shrink-0 flex items-center gap-1 px-3 py-2 rounded-full font-semibold text-sm text-slate-500 hover:text-primary transition-colors"
                >
                  <span className="material-icons-round text-sm">close</span>
                  Limpiar
                </button>
              )}
            </div>

            {openFilter && (
              <div className="absolute left-0 right-0 top-full mt-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl shadow-xl p-3 z-30">
                {openFilter === 'price' && (
                  <div className="flex flex-col gap-1">
                    {PRICE_RANGES.map((r) => (
                      <button
                        key={r.label}
                        onClick={() => { setPriceRange(priceRange?.label === r.label ? null : r); setOpenFilter(null); }}
                        className={`text-left px-3 py-2 rounded-xl text-sm font-medium transition-colors ${priceRange?.label === r.label ? 'bg-primary/10 text-primary' : 'hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200'}`}
                      >
                        {r.label}
                      </button>
                    ))}
                  </div>
                )}
                {openFilter === 'capacity' && (
                  <div className="flex flex-col gap-1">
                    {CAPACITY_RANGES.map((r) => (
                      <button
                        key={r.label}
                        onClick={() => { setCapacityRange(capacityRange?.label === r.label ? null : r); setOpenFilter(null); }}
                        className={`text-left px-3 py-2 rounded-xl text-sm font-medium transition-colors ${capacityRange?.label === r.label ? 'bg-primary/10 text-primary' : 'hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200'}`}
                      >
                        {r.label}
                      </button>
                    ))}
                  </div>
                )}
                {openFilter === 'date' && (
                  <div className="flex flex-col gap-2">
                    <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 px-1">Fecha del evento</label>
                    <input
                      type="date"
                      value={dateFilter}
                      min={new Date().toISOString().slice(0, 10)}
                      onChange={(e) => setDateFilter(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                    />
                    <div className="flex justify-between gap-2 pt-1">
                      <button
                        onClick={() => { setDateFilter(''); setOpenFilter(null); }}
                        className="text-xs font-semibold text-slate-500 hover:text-primary"
                      >
                        Limpiar
                      </button>
                      <button
                        onClick={() => setOpenFilter(null)}
                        className="text-xs font-bold text-primary"
                      >
                        Aplicar
                      </button>
                    </div>
                  </div>
                )}
                {openFilter === 'rating' && (
                  <div className="flex flex-col gap-1">
                    {RATING_OPTIONS.map((r) => (
                      <button
                        key={r}
                        onClick={() => { setMinRating(minRating === r ? null : r); setOpenFilter(null); }}
                        className={`flex items-center gap-2 text-left px-3 py-2 rounded-xl text-sm font-medium transition-colors ${minRating === r ? 'bg-primary/10 text-primary' : 'hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200'}`}
                      >
                        <span className="material-icons-round text-amber-400 text-sm">star</span>
                        {r}+ estrellas
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

        </header>

        <main className="flex-1 relative min-h-0 z-10">
          <div className="absolute inset-0">
            <MapContainer 
              center={mapCenter} 
              zoom={zoom} 
              style={{ height: '100%', width: '100%', background: '#f0f0f0' }}
              zoomControl={false}
            >
              <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />
              <MapController center={mapCenter} zoom={zoom} />
              {userLocation && (
                <Marker
                  position={userLocation}
                  icon={L.divIcon({
                    className: 'user-location-icon',
                    html: `<div style="width:18px;height:18px;border-radius:9999px;background:#3b82f6;border:3px solid white;box-shadow:0 0 0 4px rgba(59,130,246,0.3);"></div>`,
                    iconSize: [18, 18],
                    iconAnchor: [9, 9],
                  })}
                />
              )}
              {filteredVenues.map((venue) => (
                <Marker 
                  key={venue.id} 
                  position={[venue.lat, venue.lng]}
                  icon={customIcon(venue.price, selectedVenue?.id === venue.id)}
                  eventHandlers={{
                    click: () => setSelectedVenue(venue),
                  }}
                />
              ))}
            </MapContainer>
            {locationError && (
              <div className="absolute top-4 left-4 right-4 z-[1000] bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2 shadow-lg text-xs text-slate-700 dark:text-slate-200 flex items-center gap-2">
                <span className="material-icons-round text-amber-500 text-sm">location_off</span>
                {locationError}
              </div>
            )}
          </div>
          
          {/* Map Controls */}
          <div className="absolute top-4 right-4 flex flex-col gap-2 z-[1000]">
            <div className="bg-white dark:bg-slate-800 rounded-xl shadow-lg border border-slate-100 dark:border-slate-700 overflow-hidden flex flex-col">
              <button 
                onClick={() => setZoom(prev => Math.min(prev + 1, 18))}
                className="p-3 hover:bg-slate-50 dark:hover:bg-slate-700 border-b border-slate-100 dark:border-slate-700 transition-colors"
              >
                <span className="material-icons-round text-slate-700 dark:text-slate-300">add</span>
              </button>
              <button 
                onClick={() => setZoom(prev => Math.max(prev - 1, 2))}
                className="p-3 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
              >
                <span className="material-icons-round text-slate-700 dark:text-slate-300">remove</span>
              </button>
            </div>
            <button className="bg-white dark:bg-slate-800 p-3 rounded-xl shadow-lg border border-slate-100 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors">
              <span className="material-icons-round text-slate-700 dark:text-slate-300">layers</span>
            </button>
          </div>

          {/* Selected Venue Card - Positioned at the bottom */}
          {selectedVenue && (
            <div 
              onClick={() => navigate(`/user/venue/${selectedVenue.id}`)}
              className="absolute bottom-6 inset-x-4 bg-white dark:bg-slate-800 rounded-[32px] p-4 shadow-2xl flex gap-4 items-center border border-slate-100 dark:border-slate-700 cursor-pointer transform hover:translate-y-[-4px] transition-all z-[1001]"
            >
              <button 
                onClick={(e) => {
                  e.stopPropagation();
                  setSelectedVenue(null);
                }}
                className="absolute -top-3 -right-1 w-8 h-8 flex items-center justify-center bg-white dark:bg-slate-700 rounded-full text-slate-400 shadow-md hover:text-primary transition-colors z-40 border border-slate-100 dark:border-slate-600"
              >
                <span className="material-icons-round text-lg font-bold">close</span>
              </button>

              <div className="w-20 h-20 rounded-2xl bg-slate-100 dark:bg-slate-700 overflow-hidden flex-shrink-0">
                <img alt="Venue" className="w-full h-full object-cover" src={selectedVenue.image} />
              </div>
              <div className="flex-1 pr-2">
                <div className="flex justify-between items-start">
                  <h3 className="font-bold text-slate-800 dark:text-white leading-tight font-display text-[15px]">{selectedVenue.name}</h3>
                  <div className="flex items-center gap-1 text-amber-400">
                    <span className="material-icons-round text-[14px]">star</span>
                    <span className="text-xs font-bold text-slate-600 dark:text-slate-400">{selectedVenue.rating}</span>
                  </div>
                </div>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 font-medium">{selectedVenue.location}</p>
                <div className="mt-2.5 flex items-center justify-between">
                  <span className="text-primary font-bold text-[14px]">${selectedVenue.price.toLocaleString()} MXN</span>
                  <div className="flex items-center text-primary text-[11px] font-bold">
                    Ver detalles <span className="material-icons-round text-sm ml-0.5">chevron_right</span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>
    </Layout>
  );
};

export default ExploreMap;
