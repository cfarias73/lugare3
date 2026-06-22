import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

/**
 * Landing page de Lugare.
 *
 * Arquitectura de rutas (referencia para futura migración a Capacitor / app stores):
 *
 *   /                       → Landing pública (este archivo)
 *   /invite/:id             → Invitación pública compartible
 *
 *   /user/login             → Acceso huésped / cliente
 *   /user/home              → Home autenticado del huésped
 *   /user/explore           → Mapa de espacios
 *   /user/venue/:id         → Ficha de espacio
 *   /user/booking/:id       → Calendario de reserva
 *   /user/checkout/:id      → Pago
 *   /user/bookings          → Mis reservas
 *   /user/favorites         → Favoritos
 *   /user/messages          → Mensajes
 *   /user/notifications     → Notificaciones
 *   /user/profile           → Perfil
 *   /user/invitations/*     → Flujo de invitaciones
 *
 *   /provider/login         → Acceso anfitrión
 *   /provider/dashboard     → Panel anfitrión
 *   /provider/spaces        → Mis espacios
 *   /provider/create-space  → Publicar espacio
 *   /provider/calendar      → Disponibilidad
 *   /provider/received-bookings → Reservas recibidas
 *   /provider/stats         → Estadísticas
 *   /provider/messages      → Mensajes
 *   /provider/notifications → Notificaciones
 *   /provider/profile       → Perfil
 *
 *   /admin/login            → Acceso administrador
 *   /admin/dashboard        → Panel admin
 *   /admin/{users,hosts,spaces,bookings,disputes,categories,finance,settings}
 *
 * Al empaquetar con Capacitor, cada rol puede compilarse como una build independiente
 * apuntando al sub-árbol correspondiente (/user, /provider, /admin) sin modificar
 * la lógica del router.
 */

const Welcome: React.FC = () => {
  const navigate = useNavigate();
  const [logoError, setLogoError] = useState(false);

  // Imágenes de stock (Unsplash CDN) — placeholder hasta tener imágenes reales.
  const STOCK = {
    hacienda:  'https://images.unsplash.com/photo-1519167758481-83f550bb49b3?auto=format&fit=crop&w=1200&q=80',
    jardin:    'https://images.unsplash.com/photo-1464366400600-7168b8af9bc3?auto=format&fit=crop&w=900&q=80',
    terraza:   'https://images.unsplash.com/photo-1505873242700-f289a29e1e0f?auto=format&fit=crop&w=900&q=80',
  };

  const categories = [
    { icon: 'deck',         label: 'Terrazas',  img: 'https://images.unsplash.com/photo-1505873242700-f289a29e1e0f?auto=format&fit=crop&w=600&q=70' },
    { icon: 'villa',        label: 'Quintas',   img: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=600&q=70' },
    { icon: 'meeting_room', label: 'Salones',   img: 'https://images.unsplash.com/photo-1519167758481-83f550bb49b3?auto=format&fit=crop&w=600&q=70' },
    { icon: 'park',         label: 'Jardines',  img: 'https://images.unsplash.com/photo-1464366400600-7168b8af9bc3?auto=format&fit=crop&w=600&q=70' },
    { icon: 'cottage',      label: 'Haciendas', img: 'https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?auto=format&fit=crop&w=600&q=70' },
  ];

  const features = [
    {
      icon: 'search',
      title: 'Encuentra el lugar perfecto',
      desc: 'Explora terrazas, quintas, salones, jardines y haciendas con filtros y mapa interactivo.',
    },
    {
      icon: 'event_available',
      title: 'Reserva en minutos',
      desc: 'Disponibilidad en tiempo real, calendario claro y pago seguro con confirmación inmediata.',
    },
    {
      icon: 'mail',
      title: 'Invita a tus invitados',
      desc: 'Crea invitaciones digitales, agrega tu lista y compártela con un solo enlace.',
    },
    {
      icon: 'verified_user',
      title: 'Anfitriones verificados',
      desc: 'Cada espacio es revisado por nuestro equipo. Tu evento, en buenas manos.',
    },
  ];

  const hostBenefits = [
    { icon: 'trending_up', text: 'Aumenta tus ingresos rentando tu espacio' },
    { icon: 'calendar_month', text: 'Controla disponibilidad y bloqueos por fechas' },
    { icon: 'payments', text: 'Cobros automáticos por pasarela segura' },
    { icon: 'insights', text: 'Estadísticas y reportes en tiempo real' },
  ];

  const steps = [
    { n: '01', title: 'Explora', desc: 'Busca por categoría, ciudad o fecha.' },
    { n: '02', title: 'Reserva', desc: 'Elige día y horario, paga en línea.' },
    { n: '03', title: 'Disfruta', desc: 'Llega, celebra y califica tu experiencia.' },
  ];

  const Logo = () => (
    <div className="flex items-center gap-2">
      {!logoError ? (
        <img
          src="/logolugare.png"
          alt="Lugare"
          className="h-9 w-9 rounded-xl object-contain"
          onError={() => setLogoError(true)}
        />
      ) : (
        <div className="h-9 w-9 rounded-xl bg-primary flex items-center justify-center shadow-md shadow-primary/30">
          <span className="material-icons-round text-white text-xl">location_on</span>
        </div>
      )}
      <span className="font-display font-bold text-lg tracking-tight text-slate-900 dark:text-white">
        LUGARE
      </span>
    </div>
  );

  return (
    <div className="min-h-screen bg-white dark:bg-background-dark text-slate-900 dark:text-white overflow-x-hidden">
      {/* ============ NAV ============ */}
      <header className="sticky top-0 z-40 backdrop-blur-xl bg-white/80 dark:bg-background-dark/80 border-b border-slate-100 dark:border-slate-800">
        <div className="max-w-6xl mx-auto px-5 sm:px-8 h-16 flex items-center justify-between">
          <Logo />
          <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-slate-600 dark:text-slate-300">
            <a href="#como-funciona" className="hover:text-primary transition-colors">Cómo funciona</a>
            <a href="#categorias" className="hover:text-primary transition-colors">Categorías</a>
            <a href="#anfitriones" className="hover:text-primary transition-colors">Anfitriones</a>
          </nav>
          <div className="flex items-center gap-2">
            <button
              onClick={() => navigate('/user/login')}
              className="hidden sm:inline-flex text-sm font-semibold text-slate-700 dark:text-slate-200 hover:text-primary px-3 py-2 rounded-lg transition-colors"
            >
              Iniciar sesión
            </button>
            <button
              onClick={() => navigate('/user/login')}
              className="text-sm font-semibold bg-primary text-white px-4 py-2 rounded-xl shadow-md shadow-primary/20 hover:shadow-lg hover:shadow-primary/30 active:scale-95 transition-all"
            >
              Empezar
            </button>
          </div>
        </div>
      </header>

      {/* ============ HERO ============ */}
      <section className="relative">
        <div className="absolute -top-32 -left-32 w-[28rem] h-[28rem] bg-primary/15 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute top-20 -right-32 w-[28rem] h-[28rem] bg-secondary/15 rounded-full blur-3xl pointer-events-none" />

        <div className="relative max-w-6xl mx-auto px-5 sm:px-8 pt-16 pb-20 sm:pt-24 sm:pb-28 grid md:grid-cols-2 gap-12 items-center">
          <div className="space-y-7 z-10">
            <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 text-primary text-xs font-bold uppercase tracking-wider">
              <span className="material-icons-round text-sm">auto_awesome</span>
              Tu evento empieza aquí
            </span>
            <h1 className="text-5xl sm:text-6xl md:text-7xl font-display font-extrabold leading-[1.05] tracking-tight">
              Encuentra el <span className="text-primary">lugar</span> perfecto
              <br className="hidden sm:block" /> para cada <span className="text-secondary">momento</span>.
            </h1>
            <p className="text-lg text-slate-600 dark:text-slate-300 max-w-lg">
              Reserva terrazas, quintas, salones, jardines y haciendas para bodas, fiestas y
              eventos. Todo en una sola plataforma, simple y confiable.
            </p>
            <div className="flex flex-col sm:flex-row gap-3">
              <button
                onClick={() => navigate('/user/login')}
                className="group inline-flex items-center justify-center gap-2 bg-primary text-white font-bold px-6 py-4 rounded-2xl shadow-xl shadow-primary/25 hover:shadow-2xl hover:shadow-primary/40 active:scale-95 transition-all"
              >
                <span className="material-icons-round">celebration</span>
                Busco un lugar
                <span className="material-icons-round transition-transform group-hover:translate-x-1">arrow_forward</span>
              </button>
              <button
                onClick={() => navigate('/provider/login')}
                className="group inline-flex items-center justify-center gap-2 bg-white dark:bg-surface-dark border-2 border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-bold px-6 py-4 rounded-2xl hover:border-secondary hover:text-secondary active:scale-95 transition-all"
              >
                <span className="material-icons-round">apartment</span>
                Soy anfitrión
              </button>
            </div>
            <div className="flex items-center gap-6 pt-2 text-sm text-slate-500 dark:text-slate-400">
              <div className="flex items-center gap-1.5">
                <span className="material-icons-round text-primary text-base">verified</span>
                Anfitriones verificados
              </div>
              <div className="flex items-center gap-1.5">
                <span className="material-icons-round text-primary text-base">lock</span>
                Pago seguro
              </div>
            </div>
          </div>

          {/* Hero visual */}
          <div className="relative h-[420px] sm:h-[520px] hidden md:block">
            <div className="absolute inset-0 grid grid-cols-6 grid-rows-6 gap-4">
              <div
                className="col-span-4 row-span-4 col-start-2 row-start-1 rounded-[2rem] shadow-2xl shadow-primary/30 p-8 flex items-end bg-cover bg-center relative overflow-hidden"
                style={{ backgroundImage: `url(${STOCK.hacienda})` }}
              >
                <div className="absolute inset-0 bg-gradient-to-tr from-primary/85 via-primary/55 to-transparent" />
                <div className="relative text-white">
                  <p className="text-xs uppercase tracking-widest opacity-90">Destacado</p>
                  <p className="font-display text-2xl font-bold leading-tight">Hacienda San Mateo</p>
                  <p className="text-sm opacity-90">Cap. 250 · jardín y salón</p>
                </div>
              </div>
              <div
                className="col-span-3 row-span-2 col-start-1 row-start-5 rounded-3xl shadow-xl shadow-secondary/30 p-5 flex flex-col justify-between text-white bg-cover bg-center relative overflow-hidden"
                style={{ backgroundImage: `url(${STOCK.jardin})` }}
              >
                <div className="absolute inset-0 bg-gradient-to-br from-secondary/80 to-secondary/40" />
                <span className="material-icons-round text-3xl relative">park</span>
                <p className="font-bold leading-tight relative">Jardines al aire libre</p>
              </div>
              <div
                className="col-span-3 row-span-2 col-start-4 row-start-5 rounded-3xl shadow-xl p-5 flex flex-col justify-between text-white bg-cover bg-center relative overflow-hidden"
                style={{ backgroundImage: `url(${STOCK.terraza})` }}
              >
                <div className="absolute inset-0 bg-gradient-to-br from-slate-900/85 to-slate-900/40" />
                <span className="material-icons-round text-3xl relative">deck</span>
                <p className="font-bold leading-tight relative">Terrazas con vista</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ============ CATEGORÍAS ============ */}
      <section id="categorias" className="py-16 sm:py-24 bg-slate-50 dark:bg-slate-900/40">
        <div className="max-w-6xl mx-auto px-5 sm:px-8">
          <div className="flex items-end justify-between gap-6 mb-10">
            <div>
              <p className="text-primary text-sm font-bold uppercase tracking-widest mb-2">Categorías</p>
              <h2 className="text-3xl sm:text-4xl font-display font-bold tracking-tight">
                Espacios para cada celebración
              </h2>
            </div>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
            {categories.map((c) => (
              <button
                key={c.label}
                onClick={() => navigate('/user/login')}
                className="group bg-white dark:bg-surface-dark border border-slate-100 dark:border-slate-800 rounded-3xl overflow-hidden text-left hover:border-primary hover:shadow-xl hover:shadow-primary/10 hover:-translate-y-1 active:scale-95 transition-all"
              >
                <div
                  className="relative h-28 bg-cover bg-center"
                  style={{ backgroundImage: `url(${c.img})` }}
                >
                  <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
                  <div className="absolute bottom-2 left-2 w-9 h-9 rounded-xl bg-white/95 text-primary flex items-center justify-center shadow-md group-hover:bg-primary group-hover:text-white transition-colors">
                    <span className="material-icons-round text-base">{c.icon}</span>
                  </div>
                </div>
                <div className="p-4">
                  <p className="font-bold text-slate-900 dark:text-white">{c.label}</p>
                  <p className="text-xs text-slate-500 mt-1">Ver disponibles →</p>
                </div>
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* ============ CÓMO FUNCIONA ============ */}
      <section id="como-funciona" className="py-16 sm:py-24">
        <div className="max-w-6xl mx-auto px-5 sm:px-8">
          <div className="text-center max-w-2xl mx-auto mb-14">
            <p className="text-primary text-sm font-bold uppercase tracking-widest mb-2">Cómo funciona</p>
            <h2 className="text-3xl sm:text-4xl font-display font-bold tracking-tight">
              Tres pasos para tu próximo evento
            </h2>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            {steps.map((s) => (
              <div
                key={s.n}
                className="relative bg-white dark:bg-surface-dark border border-slate-100 dark:border-slate-800 rounded-3xl p-8 overflow-hidden"
              >
                <span className="absolute -top-4 -right-2 text-[8rem] font-display font-extrabold text-slate-100 dark:text-slate-800 leading-none select-none">
                  {s.n}
                </span>
                <div className="relative">
                  <h3 className="text-2xl font-display font-bold mb-2">{s.title}</h3>
                  <p className="text-slate-600 dark:text-slate-300">{s.desc}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="grid sm:grid-cols-2 gap-5 mt-12">
            {features.map((f) => (
              <div key={f.title} className="flex gap-4 p-5 rounded-2xl bg-slate-50 dark:bg-slate-900/40">
                <div className="shrink-0 w-12 h-12 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
                  <span className="material-icons-round">{f.icon}</span>
                </div>
                <div>
                  <p className="font-bold mb-1">{f.title}</p>
                  <p className="text-sm text-slate-600 dark:text-slate-300">{f.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ============ ANFITRIONES ============ */}
      <section id="anfitriones" className="py-16 sm:py-24 bg-gradient-to-br from-slate-900 via-slate-900 to-slate-800 text-white">
        <div className="max-w-6xl mx-auto px-5 sm:px-8 grid md:grid-cols-2 gap-12 items-center">
          <div>
            <p className="text-secondary text-sm font-bold uppercase tracking-widest mb-2">Para anfitriones</p>
            <h2 className="text-3xl sm:text-4xl font-display font-bold tracking-tight mb-4">
              Convierte tu espacio en una fuente de ingresos
            </h2>
            <p className="text-slate-300 mb-8">
              Publica tu terraza, quinta, salón, jardín o hacienda. Nosotros nos encargamos de
              cobros, calendario y difusión.
            </p>
            <button
              onClick={() => navigate('/provider/login')}
              className="inline-flex items-center gap-2 bg-secondary text-white font-bold px-6 py-4 rounded-2xl shadow-xl shadow-secondary/25 hover:shadow-2xl hover:shadow-secondary/40 active:scale-95 transition-all"
            >
              <span className="material-icons-round">add_business</span>
              Publicar mi espacio
              <span className="material-icons-round">arrow_forward</span>
            </button>
          </div>
          <ul className="space-y-3">
            {hostBenefits.map((b) => (
              <li
                key={b.text}
                className="flex items-center gap-4 p-4 rounded-2xl bg-white/5 border border-white/10 backdrop-blur"
              >
                <div className="w-11 h-11 shrink-0 rounded-xl bg-secondary/20 text-secondary flex items-center justify-center">
                  <span className="material-icons-round">{b.icon}</span>
                </div>
                <p className="font-medium">{b.text}</p>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* ============ ACCESOS POR ROL ============ */}
      <section className="py-16 sm:py-24">
        <div className="max-w-6xl mx-auto px-5 sm:px-8">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <p className="text-primary text-sm font-bold uppercase tracking-widest mb-2">Accede a tu cuenta</p>
            <h2 className="text-3xl sm:text-4xl font-display font-bold tracking-tight">
              Elige tu experiencia
            </h2>
          </div>
          <div className="grid md:grid-cols-2 gap-5 max-w-3xl mx-auto">
            <button
              onClick={() => navigate('/user/login')}
              className="group bg-white dark:bg-surface-dark border-2 border-slate-100 dark:border-slate-800 p-7 rounded-3xl text-left transition-all hover:border-primary hover:shadow-xl hover:shadow-primary/10 active:scale-95"
            >
              <div className="w-14 h-14 rounded-2xl bg-orange-50 dark:bg-orange-900/20 flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-white transition-colors mb-4">
                <span className="material-icons-round text-3xl">celebration</span>
              </div>
              <h3 className="font-display font-bold text-xl mb-1">Busco un lugar</h3>
              <p className="text-sm text-slate-500 mb-3">Para mi boda, fiesta o evento</p>
              <span className="inline-flex items-center gap-1 text-sm font-bold text-primary">
                Entrar como huésped <span className="material-icons-round text-base">arrow_forward</span>
              </span>
            </button>
            <button
              onClick={() => navigate('/provider/login')}
              className="group bg-white dark:bg-surface-dark border-2 border-slate-100 dark:border-slate-800 p-7 rounded-3xl text-left transition-all hover:border-secondary hover:shadow-xl hover:shadow-secondary/10 active:scale-95"
            >
              <div className="w-14 h-14 rounded-2xl bg-cyan-50 dark:bg-cyan-900/20 flex items-center justify-center text-secondary group-hover:bg-secondary group-hover:text-white transition-colors mb-4">
                <span className="material-icons-round text-3xl">apartment</span>
              </div>
              <h3 className="font-display font-bold text-xl mb-1">Soy anfitrión</h3>
              <p className="text-sm text-slate-500 mb-3">Quiero rentar mi espacio</p>
              <span className="inline-flex items-center gap-1 text-sm font-bold text-secondary">
                Entrar como anfitrión <span className="material-icons-round text-base">arrow_forward</span>
              </span>
            </button>
          </div>
        </div>
      </section>

      {/* ============ FOOTER ============ */}
      <footer className="border-t border-slate-100 dark:border-slate-800 py-10">
        <div className="max-w-6xl mx-auto px-5 sm:px-8 flex flex-col md:flex-row md:items-center md:justify-between gap-6">
          <Logo />
          <p className="text-xs text-slate-400 dark:text-slate-600 font-medium">
            © 2026 Lugare. Todos los derechos reservados.
          </p>
          <button
            onClick={() => navigate('/admin/login')}
            className="text-[10px] text-slate-300 dark:text-slate-700 hover:text-slate-500 transition-colors uppercase tracking-widest"
          >
            Acceso administrador
          </button>
        </div>
      </footer>
    </div>
  );
};

export default Welcome;
