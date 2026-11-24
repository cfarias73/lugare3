
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../../components/Layout';
import { useUser } from '../../context/UserContext';
import { getVenues } from '../../src/services/venueService';
import { getProfile } from '../../src/services/profileService';
import { getCategories, Category } from '../../src/services/categoryService';
import { shareVenue } from '../../src/utils/shareVenue';
import { getInitialsAvatar } from '../../src/utils/avatar';
import { getTodayDateStr } from '../../src/utils/date';
import { toast } from 'sonner';
import { Capacitor } from '@capacitor/core';
import { Venue } from '../../types';

const Home: React.FC = () => {
  const navigate = useNavigate();
  const { user, updateName, bookings, invitations, isFavorite, toggleFavorite } = useUser();
  const [venues, setVenues] = useState<Venue[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [isLoading, setIsLoading] = useState(true);
  const [selectedCity, setSelectedCity] = useState<string>('all');
  const [cityPickerOpen, setCityPickerOpen] = useState(false);
  const [citySearch, setCitySearch] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);

  useEffect(() => {
    if (!user?.id) return;
    getProfile(user.id)
      .then((p) => {
        if (!p) return;
        if (p.avatar_url) setAvatarUrl(p.avatar_url);
        if (p.name && p.name !== user.name) {
          updateName(p.name);
        }
      })
      .catch(() => {});
  }, [user?.id, user?.name, updateName]);

  useEffect(() => {
    const load = async () => {
      setIsLoading(true);
      const [v, c] = await Promise.all([getVenues(), getCategories()]);
      setVenues(v);
      setCategories(c);
      setIsLoading(false);
    };
    load();
  }, []);

  const cities = useMemo(() => {
    const set = new Set<string>();
    venues.forEach((v) => { if (v.city) set.add(v.city); });
    return Array.from(set).sort((a, b) => a.localeCompare(b));
  }, [venues]);

  const filteredCities = useMemo(() => {
    const q = citySearch.trim().toLowerCase();
    if (!q) return cities;
    return cities.filter((c) => c.toLowerCase().includes(q));
  }, [cities, citySearch]);

  const filteredVenues = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return venues.filter((v) => {
      if (activeCategory !== 'all' && (v as any).category !== activeCategory) return false;
      if (selectedCity !== 'all' && v.city !== selectedCity) return false;
      if (q) {
        const hay = `${v.name} ${v.location || ''} ${v.city || ''}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [venues, activeCategory, selectedCity, searchQuery]);

  const [showInvitationsModal, setShowInvitationsModal] = useState(false);

  const nextBooking = useMemo(() => {
    if (!bookings || bookings.length === 0) return null;
    const todayStr = getTodayDateStr();
    const upcoming = bookings
      .filter(
        (b) =>
          Boolean(b.eventDate) &&
          b.eventDate >= todayStr &&
          b.rawStatus !== 'cancelled' &&
          b.rawStatus !== 'rejected' &&
          b.rawStatus !== 'completed'
      )
      .sort((a, b) => (a.eventDate || '').localeCompare(b.eventDate || ''));
    return upcoming[0] || null;
  }, [bookings]);

  const handleShare = async (e: React.MouseEvent, venue: Venue) => {
    e.stopPropagation();
    try {
      const result = await shareVenue(venue.id, venue.name);
      if (result === 'copied') toast.success('Enlace del espacio copiado');
    } catch (error) {
      console.error('Error al compartir espacio:', error);
      toast.error('No se pudo compartir el espacio. Inténtalo de nuevo.');
    }
  };

  const copyInvitationLink = async (invitationId: string) => {
    const baseUrl = Capacitor.isNativePlatform() ? 'https://www.lugare.mx' : window.location.origin;
    const url = `${baseUrl}/#/invite/${invitationId}`;
    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(url);
      } else {
        const textArea = document.createElement('textarea');
        textArea.value = url;
        textArea.setAttribute('readonly', '');
        textArea.style.position = 'fixed';
        textArea.style.left = '-9999px';
        document.body.appendChild(textArea);
        textArea.select();
        document.execCommand('copy');
        document.body.removeChild(textArea);
      }
      toast.success('Enlace de la invitación copiado');
    } catch {
      toast.error('No se pudo copiar el enlace');
    }
  };

  const venuesSliderRef = useRef<HTMLDivElement | null>(null);
  const dragStartRef = useRef<{ x: number; y: number } | null>(null);
  const isDraggingCardRef = useRef(false);

  const handleCardPointerDown = (e: React.PointerEvent) => {
    dragStartRef.current = { x: e.clientX, y: e.clientY };
    isDraggingCardRef.current = false;
  };

  const handleCardPointerMove = (e: React.PointerEvent) => {
    if (!dragStartRef.current) return;
    const dx = Math.abs(e.clientX - dragStartRef.current.x);
    const dy = Math.abs(e.clientY - dragStartRef.current.y);
    if (dx > 8 || dy > 8) {
      isDraggingCardRef.current = true;
    }
  };

  const handleCardClick = (venueId: string) => {
    if (isDraggingCardRef.current) {
      isDraggingCardRef.current = false;
      return;
    }
    navigate(`/user/venue/${venueId}`);
  };

  const scrollSlider = (direction: 'left' | 'right') => {
    if (!venuesSliderRef.current) return;
    const scrollAmount = venuesSliderRef.current.clientWidth * 0.85;
    venuesSliderRef.current.scrollBy({
      left: direction === 'left' ? -scrollAmount : scrollAmount,
      behavior: 'smooth',
    });
  };

  return (
    <Layout>
      <header className="px-6 pt-[calc(env(safe-area-inset-top,0px)+1rem)] pb-4 flex justify-between items-center bg-white dark:bg-surface-dark sticky top-0 z-40 shadow-sm transition-colors">
        <div>
          <h1 className="text-xl font-bold text-slate-800 dark:text-white font-display">Hola, {user?.name || 'Bienvenido'}</h1>
        </div>
        <div className="flex items-center space-x-3">
          <button
            onClick={() => navigate('/user/favorites')}
            aria-label="Ver favoritos"
            className="relative p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <span className="material-icons-outlined text-red-500">favorite</span>
          </button>
          <button
            onClick={() => navigate('/user/notifications')}
            aria-label="Ver notificaciones"
            className="relative p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <span className="material-icons-outlined text-slate-600 dark:text-slate-300">notifications</span>
          </button>
          <button
            onClick={() => navigate('/user/profile')}
            aria-label="Ir a mi perfil"
            className="rounded-full focus:outline-none focus:ring-2 focus:ring-primary/40"
          >
            <img 
              alt="Avatar" 
              className="w-10 h-10 rounded-full object-cover ring-2 ring-primary/20 cursor-pointer bg-slate-100" 
              src={avatarUrl || getInitialsAvatar(user?.name, 'Usuario')} 
              loading="lazy"
            />
          </button>
        </div>
      </header>

      <div className="px-5 mt-4 space-y-8">
        {/* Next Booking Card */}
        {nextBooking && (
          <section>
            <div className="flex justify-between items-end mb-4">
              <h2 className="text-lg font-bold font-display">Tu próxima reserva</h2>
              <button onClick={() => navigate('/user/bookings')} className="text-secondary font-semibold text-sm">Ver todas</button>
            </div>
            <div 
              onClick={() => navigate('/user/bookings')}
              className="bg-primary rounded-3xl p-5 text-white shadow-lg shadow-primary/30 relative overflow-hidden cursor-pointer"
            >
              <div className="relative z-10">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-xl font-bold">{nextBooking.venueName}</h3>
                    <p className="text-white/80 text-xs flex items-center mt-1">
                      <span className="material-icons-outlined text-xs mr-1">location_on</span>
                      {nextBooking.location}
                    </p>
                  </div>
                  <div className="bg-white/20 backdrop-blur-md px-3 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider">
                    {nextBooking.status}
                  </div>
                </div>
                <div className="flex gap-6">
                  <div>
                    <p className="text-white/60 text-[10px] uppercase font-bold tracking-widest mb-1">Fecha</p>
                    <p className="text-sm font-bold">{nextBooking.date}</p>
                  </div>
                  <div>
                    <p className="text-white/60 text-[10px] uppercase font-bold tracking-widest mb-1">Horario</p>
                    <p className="text-sm font-bold">{nextBooking.time}</p>
                  </div>
                </div>
              </div>
              <span className="material-icons-outlined absolute -right-4 -bottom-4 text-white/10 text-9xl rotate-12">event_available</span>
            </div>
          </section>
        )}

        {/* Invitations Status */}
        {invitations.length > 0 && (
          <section>
            <div className="flex justify-between items-end mb-4">
              <h2 className="text-lg font-bold font-display">Tus invitaciones</h2>
              <button 
                onClick={() => setShowInvitationsModal(true)} 
                className="text-secondary font-semibold text-sm hover:underline"
              >
                Gestionar
              </button>
            </div>
            <div 
              onClick={() => setShowInvitationsModal(true)}
              className="bg-white dark:bg-surface-dark rounded-3xl p-5 border border-slate-100 dark:border-slate-800 shadow-sm flex items-center gap-4 cursor-pointer hover:border-primary/30 transition-colors"
            >
              <div className="bg-secondary/10 w-12 h-12 rounded-2xl flex items-center justify-center">
                <span className="material-icons-outlined text-secondary">send</span>
              </div>
              <div className="flex-1">
                <p className="text-sm font-bold text-slate-800 dark:text-white">
                  {invitations.length} {invitations.length === 1 ? 'invitación enviada' : 'invitaciones enviadas'}
                </p>
                <p className="text-xs text-slate-500">
                  {invitations.reduce((acc, inv) => acc + (inv.guests?.length || 0), 0)} invitados en total
                </p>
              </div>
              <button 
                onClick={(e) => { e.stopPropagation(); setShowInvitationsModal(true); }}
                className="text-primary font-bold text-xs"
              >
                Ver estado
              </button>
            </div>
          </section>
        )}

        {/* City Selector */}
        <div className="relative">
          <button
            onClick={() => setCityPickerOpen((o) => !o)}
            className="w-full flex items-center justify-between gap-2 bg-white dark:bg-surface-dark border border-slate-200 dark:border-slate-700 rounded-2xl px-4 py-3 shadow-sm hover:border-primary/40 transition-colors"
          >
            <div className="flex items-center gap-2 min-w-0">
              <span className="material-icons-outlined text-primary">place</span>
              <div className="text-left min-w-0">
                <p className="text-[10px] uppercase tracking-widest font-bold text-slate-400 leading-none mb-0.5">Ciudad</p>
                <p className="text-sm font-bold text-slate-800 dark:text-white truncate">
                  {selectedCity === 'all' ? 'Todas las ciudades' : selectedCity}
                </p>
              </div>
            </div>
            <span className={`material-icons-outlined text-slate-500 transition-transform ${cityPickerOpen ? 'rotate-180' : ''}`}>expand_more</span>
          </button>
          {cityPickerOpen && (
            <div className="absolute z-50 mt-2 left-0 right-0 bg-white dark:bg-surface-dark border border-slate-200 dark:border-slate-700 rounded-2xl shadow-xl p-3 max-h-80 overflow-hidden flex flex-col">
              <div className="relative mb-2">
                <span className="material-icons-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-lg">search</span>
                <input
                  autoFocus
                  value={citySearch}
                  onChange={(e) => setCitySearch(e.target.value)}
                  placeholder="Buscar ciudad..."
                  className="w-full pl-10 pr-3 py-2 text-sm bg-slate-100 dark:bg-slate-800 rounded-xl outline-none focus:ring-2 focus:ring-primary/40 dark:text-white"
                />
              </div>
              <div className="overflow-y-auto -mx-1 px-1">
                <button
                  onClick={() => { setSelectedCity('all'); setCityPickerOpen(false); setCitySearch(''); }}
                  className={`w-full text-left px-3 py-2.5 rounded-xl text-sm flex items-center justify-between ${selectedCity === 'all' ? 'bg-primary/10 text-primary font-bold' : 'hover:bg-slate-50 dark:hover:bg-slate-800 dark:text-white'}`}
                >
                  Todas las ciudades
                  {selectedCity === 'all' && <span className="material-icons-outlined text-base">check</span>}
                </button>
                {filteredCities.length === 0 ? (
                  <p className="text-xs text-slate-400 px-3 py-3">Sin coincidencias</p>
                ) : filteredCities.map((c) => (
                  <button
                    key={c}
                    onClick={() => { setSelectedCity(c); setCityPickerOpen(false); setCitySearch(''); }}
                    className={`w-full text-left px-3 py-2.5 rounded-xl text-sm flex items-center justify-between ${selectedCity === c ? 'bg-primary/10 text-primary font-bold' : 'hover:bg-slate-50 dark:hover:bg-slate-800 dark:text-white'}`}
                  >
                    {c}
                    {selectedCity === c && <span className="material-icons-outlined text-base">check</span>}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Search Bar */}
        <div className="flex gap-3">
          <div className="relative flex-grow">
            <span className="material-icons-outlined absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">search</span>
            <input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-12 pr-12 py-3.5 bg-slate-100 dark:bg-slate-800 border-none rounded-2xl text-sm focus:ring-2 focus:ring-primary focus:bg-white transition-all dark:text-white"
              placeholder="Buscar espacios, ubicaciones..."
              type="text"
            />
            {searchQuery ? (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-primary"
                aria-label="Limpiar búsqueda"
              >
                <span className="material-icons-outlined">close</span>
              </button>
            ) : (
              <span className="material-icons-outlined absolute right-4 top-1/2 -translate-y-1/2 text-primary cursor-pointer">tune</span>
            )}
          </div>
          <button
            onClick={() => {
              const params = new URLSearchParams();
              if (selectedCity !== 'all') params.set('city', selectedCity);
              const query = params.toString();
              navigate(`/user/explore${query ? `?${query}` : ''}`);
            }}
            className="bg-slate-100 dark:bg-slate-800 p-3.5 rounded-2xl flex items-center justify-center hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
            aria-label="Ver espacios en el mapa"
          >
            <span className="material-icons-outlined text-primary">map</span>
          </button>
        </div>

        {/* Categories Scroller */}
        <div className="flex overflow-x-auto horizontal-slider no-scrollbar gap-3 -mx-5 px-5 pb-2 snap-x">
          <button
            onClick={() => setActiveCategory('all')}
            className={`snap-start shrink-0 flex items-center gap-2 px-5 py-2.5 rounded-full font-medium whitespace-nowrap transition-all ${
              activeCategory === 'all'
                ? 'bg-primary text-white shadow-lg shadow-primary/20'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
            }`}
          >
            <span className="material-icons-outlined text-lg">grid_view</span> Todos
          </button>
          {categories.map((c) => {
            const active = activeCategory === c.slug;
            return (
              <button
                key={c.id}
                onClick={() => setActiveCategory(c.slug)}
                className={`snap-start shrink-0 flex items-center gap-2 px-5 py-2.5 rounded-full font-medium whitespace-nowrap transition-all ${
                  active
                    ? 'bg-primary text-white shadow-lg shadow-primary/20'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
                }`}
              >
                <span className="material-icons-outlined text-lg">{c.icon}</span> {c.name}
              </button>
            );
          })}
        </div>

        {/* Approved spaces available for browsing */}
        <section>
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-bold font-display">Espacios disponibles</h2>
            {filteredVenues.length > 1 && (
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => scrollSlider('left')}
                  className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 flex items-center justify-center hover:bg-slate-200 dark:hover:bg-slate-700 active:scale-95 transition-all shadow-xs"
                  aria-label="Espacios anteriores"
                >
                  <span className="material-icons-round text-lg">chevron_left</span>
                </button>
                <button
                  type="button"
                  onClick={() => scrollSlider('right')}
                  className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 flex items-center justify-center hover:bg-slate-200 dark:hover:bg-slate-700 active:scale-95 transition-all shadow-xs"
                  aria-label="Espacios siguientes"
                >
                  <span className="material-icons-round text-lg">chevron_right</span>
                </button>
              </div>
            )}
          </div>
          <div 
            ref={venuesSliderRef}
            className="flex overflow-x-auto horizontal-slider no-scrollbar gap-5 -mx-5 px-5 pb-4 snap-x snap-proximity scroll-smooth"
          >
            {isLoading ? (
              [1, 2].map((i) => (
                <div key={i} className="snap-center shrink-0 w-[calc(100vw-2.5rem)] max-w-[320px] bg-white dark:bg-surface-dark rounded-3xl overflow-hidden shadow-sm border border-slate-100 dark:border-slate-800">
                  <div className="h-48 bg-slate-200 dark:bg-slate-700 animate-pulse" />
                  <div className="p-4 space-y-3">
                    <div className="h-5 bg-slate-200 dark:bg-slate-700 animate-pulse w-3/4" />
                    <div className="h-4 bg-slate-200 dark:bg-slate-700 animate-pulse w-1/2" />
                  </div>
                </div>
              ))
            ) : filteredVenues.length === 0 ? (
              <div className="text-sm text-slate-500 py-8 px-2">No hay espacios en esta categoría.</div>
            ) : filteredVenues.map((venue) => (
              <div 
                key={venue.id} 
                onPointerDown={handleCardPointerDown}
                onPointerMove={handleCardPointerMove}
                onClick={() => handleCardClick(venue.id)}
                className="snap-center shrink-0 w-[calc(100vw-2.5rem)] max-w-[320px] bg-white dark:bg-surface-dark rounded-3xl overflow-hidden shadow-sm border border-slate-100 dark:border-slate-800 cursor-pointer select-none transition-transform active:scale-[0.99]"
              >
                <div className="relative h-48">
                  <img alt={venue.name} className="w-full h-full object-cover pointer-events-none select-none" src={venue.image} loading="lazy" />
                  <div className="absolute top-4 right-4 flex gap-2 z-10">
                    <button 
                      className="bg-white/90 p-2 rounded-full shadow-md hover:text-primary transition-colors" 
                      onClick={(e) => void handleShare(e, venue)}
                    >
                      <span className="material-icons-outlined text-slate-700 text-xl">share</span>
                    </button>
                    <button 
                      className="bg-white/90 p-2 rounded-full shadow-md hover:text-red-500 transition-colors" 
                      onClick={(e) => { e.stopPropagation(); toggleFavorite(venue.id); }}
                      aria-label={isFavorite(venue.id) ? 'Quitar de favoritos' : 'Añadir a favoritos'}
                    >
                      <span className="material-icons-outlined text-primary text-xl">{isFavorite(venue.id) ? 'favorite' : 'favorite_border'}</span>
                    </button>
                  </div>
                </div>
                <div className="p-4">
                  <div className="flex justify-between items-start mb-1">
                    <h3 className="font-bold text-slate-800 dark:text-white truncate flex-1 mr-2">{venue.name}</h3>
                    <div className="flex items-center gap-1 shrink-0">
                      <span className="material-icons-round text-yellow-400 text-sm">star</span>
                      <span className="text-xs font-bold dark:text-white">{venue.rating}</span>
                    </div>
                  </div>
                  <p className="text-slate-400 text-xs flex items-center mb-4 truncate">
                    <span className="material-icons-outlined text-xs mr-1">location_on</span> {venue.location}
                  </p>
                  <div className="flex justify-between items-center">
                    <p className="font-bold text-primary font-display">${venue.price.toLocaleString()}<span className="text-[10px] text-slate-400 font-normal">/hora</span></p>
                    <button 
                      onClick={(e) => { 
                        e.stopPropagation(); 
                        if (!isDraggingCardRef.current) {
                          navigate(`/user/venue/${venue.id}`);
                        }
                      }} 
                      className="bg-secondary text-white px-6 py-3 rounded-xl text-xs font-bold hover:bg-secondary/90 transition-colors"
                    >
                      Reservar
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

      </div>

      {/* Modal de Gestión de Invitaciones */}
      {showInvitationsModal && (
        <div 
          className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/60 backdrop-blur-sm animate-fadeIn"
          onClick={() => setShowInvitationsModal(false)}
        >
          <div 
            className="bg-white dark:bg-surface-dark w-full sm:max-w-lg rounded-t-[32px] sm:rounded-[32px] p-6 shadow-2xl max-h-[85vh] flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-secondary/10 flex items-center justify-center text-secondary">
                  <span className="material-icons-outlined">mail</span>
                </div>
                <div>
                  <h2 className="text-lg font-bold font-display text-slate-800 dark:text-white">Tus invitaciones</h2>
                  <p className="text-xs text-slate-500">
                    {invitations.length} {invitations.length === 1 ? 'evento registrado' : 'eventos registrados'}
                  </p>
                </div>
              </div>
              <button 
                onClick={() => setShowInvitationsModal(false)}
                className="w-9 h-9 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-500 hover:text-slate-800 dark:hover:text-white transition-colors"
                aria-label="Cerrar"
              >
                <span className="material-icons-outlined text-lg">close</span>
              </button>
            </div>

            <div className="overflow-y-auto py-4 space-y-3 flex-1">
              {invitations.length === 0 ? (
                <div className="text-center py-8">
                  <span className="material-icons-outlined text-4xl text-slate-300 dark:text-slate-600 mb-2">mark_email_read</span>
                  <p className="text-sm font-semibold text-slate-600 dark:text-slate-400">No tienes invitaciones creadas aún</p>
                  <p className="text-xs text-slate-400 mt-1">Crea una invitación digital para tu próximo evento y compártela con tus invitados.</p>
                </div>
              ) : (
                invitations.map((inv) => {
                  const guestCount = inv.guests?.length || 0;
                  const confirmedCount = inv.guests?.filter((g) => g.status === 'confirmed').length || 0;
                  return (
                    <div 
                      key={inv.id} 
                      className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-700/60 space-y-3"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <h3 className="font-bold text-sm text-slate-800 dark:text-white truncate">
                            {inv.eventName || 'Invitación a Evento'}
                          </h3>
                          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-500 mt-1">
                            {inv.date && (
                              <span className="flex items-center gap-1">
                                <span className="material-icons-outlined text-xs text-primary">calendar_today</span>
                                {inv.date}
                              </span>
                            )}
                            {inv.time && (
                              <span className="flex items-center gap-1">
                                <span className="material-icons-outlined text-xs text-primary">schedule</span>
                                {inv.time}
                              </span>
                            )}
                            {inv.location && (
                              <span className="flex items-center gap-1 truncate max-w-[180px]">
                                <span className="material-icons-outlined text-xs text-primary">place</span>
                                {inv.location}
                              </span>
                            )}
                          </div>
                        </div>
                        <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-secondary/10 text-secondary shrink-0">
                          {confirmedCount}/{guestCount} conf.
                        </span>
                      </div>

                      <div className="flex items-center gap-2 pt-2 border-t border-slate-200/60 dark:border-slate-700/60">
                        <button
                          type="button"
                          onClick={() => copyInvitationLink(inv.id)}
                          className="flex-1 py-2 px-3 rounded-xl bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 text-xs font-bold text-slate-700 dark:text-slate-200 flex items-center justify-center gap-1.5 hover:bg-slate-100 dark:hover:bg-slate-600 transition-colors"
                        >
                          <span className="material-icons-outlined text-sm">content_copy</span>
                          Copiar enlace
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setShowInvitationsModal(false);
                            navigate(`/invite/${inv.id}`);
                          }}
                          className="flex-1 py-2 px-3 rounded-xl bg-primary text-white text-xs font-bold flex items-center justify-center gap-1.5 hover:bg-primary/90 transition-colors shadow-sm"
                        >
                          <span className="material-icons-outlined text-sm">visibility</span>
                          Ver invitación
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            <div className="pt-3 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={() => {
                  setShowInvitationsModal(false);
                  navigate('/user/invitations/create');
                }}
                className="w-full py-3.5 rounded-2xl bg-secondary text-white font-bold text-sm flex items-center justify-center gap-2 hover:bg-secondary/90 transition-colors shadow-md"
              >
                <span className="material-icons-outlined text-base">add_circle_outline</span>
                Crear nueva invitación
              </button>
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
};

export default Home;
