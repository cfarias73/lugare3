import React, { useEffect, useState } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { useUser } from '../../context/UserContext';
import { toast } from 'sonner';
import { supabase } from '../../lib/supabaseClient';

const Checkout: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const location = useLocation();
  const { user } = useUser();
  const [isProcessing, setIsProcessing] = useState(false);
  const [venue, setVenue] = useState<any>(null);
  const [settings, setSettings] = useState<{ commission_percent: number }>({ commission_percent: 10 });

  // Booking details (from query params or defaults)
  const params = new URLSearchParams(location.search);
  const eventDate = params.get('date') || new Date().toISOString().split('T')[0];
  const startTime = params.get('start') || '19:00:00';
  const endTime = params.get('end') || '23:00:00';
  const hours = Number(params.get('hours') || 4);
  const guestCount = Number(params.get('guests') || 10);

  useEffect(() => {
    supabase.from('venues').select('*').eq('id', id).single().then(({ data }) => setVenue(data));
    supabase.from('platform_settings').select('commission_percent').limit(1).single().then(({ data }) => {
      if (data) setSettings(data);
    });
  }, [id]);

  if (!venue) {
    return <div className="p-6 text-center">Cargando...</div>;
  }

  const subtotal = venue.price_per_hour * hours;
  const stripeFee = Math.round(subtotal * 0.036 + 3);
  const total = subtotal + stripeFee;

  const handlePayment = async () => {
    if (!user) {
      toast.error('Debes iniciar sesión');
      return;
    }
    setIsProcessing(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('No session');

      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const res = await fetch(`${supabaseUrl}/functions/v1/create-checkout`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          venue_id: venue.id,
          event_date: eventDate,
          start_time: startTime,
          end_time: endTime,
          guest_count: guestCount,
          hours,
          origin: window.location.origin,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Error creando checkout');

      // Redirect to Stripe Checkout.
      // En el preview de Lovable estamos dentro de un iframe con Permissions-Policy
      // que bloquea la navegación a dominios externos (checkout.stripe.com),
      // por lo que intentamos navegar el top frame y, si falla, abrimos en nueva pestaña.
      try {
        if (window.top && window.top !== window.self) {
          window.top.location.href = data.url;
        } else {
          window.location.href = data.url;
        }
      } catch {
        const w = window.open(data.url, '_blank');
        if (!w) window.location.href = data.url;
      }
    } catch (e: any) {
      console.error(e);
      toast.error(e.message || 'Error al procesar el pago');
      setIsProcessing(false);
    }
  };

  return (
    <div className="bg-background-light dark:bg-background-dark text-slate-900 dark:text-slate-100 min-h-screen max-w-md mx-auto flex flex-col">
      <header className="sticky top-0 z-50 bg-white dark:bg-background-dark border-b border-gray-100 dark:border-gray-800 px-4 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate(-1)} className="p-1 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full">
            <span className="material-icons-outlined">arrow_back</span>
          </button>
          <h1 className="text-lg font-bold font-display">Confirmar y Pagar</h1>
        </div>
        <div className="w-10 h-10 flex items-center justify-center bg-orange-50 dark:bg-orange-900/20 rounded-full">
          <span className="material-icons-outlined text-primary">lock</span>
        </div>
      </header>

      <main className="pb-40 flex-1 overflow-y-auto px-6 py-6 space-y-4">
        {/* Booking Summary */}
        <div className="bg-white dark:bg-surface-dark rounded-2xl p-4 shadow-sm border border-slate-100 dark:border-slate-800 flex gap-4">
          <div className="relative w-24 h-24 rounded-xl overflow-hidden flex-shrink-0">
            <img alt="Venue" className="w-full h-full object-cover" src={venue.image} />
          </div>
          <div className="flex-1">
            <h3 className="font-bold text-base leading-tight font-display">{venue.name}</h3>
            <div className="flex items-center gap-1 mt-1">
              <span className="material-icons-outlined text-primary text-sm">place</span>
              <span className="text-xs text-slate-500">{venue.city}</span>
            </div>
            <div className="mt-2 flex flex-wrap gap-2">
              <span className="text-[10px] px-2 py-0.5 bg-slate-50 dark:bg-slate-800 rounded-full text-slate-600">{eventDate}</span>
              <span className="text-[10px] px-2 py-0.5 bg-slate-50 dark:bg-slate-800 rounded-full text-slate-600">{hours}h</span>
            </div>
          </div>
        </div>

        {/* Cost Breakdown */}
        <div className="bg-white dark:bg-surface-dark rounded-2xl p-5 shadow-sm border border-slate-100 dark:border-slate-800">
          <h4 className="font-bold mb-4 text-[10px] uppercase tracking-wider text-slate-400">Resumen</h4>
          <div className="space-y-3">
            <div className="flex justify-between text-sm">
              <span className="text-slate-600 dark:text-slate-400">Espacio (${venue.price_per_hour}/h × {hours}h)</span>
              <span className="font-medium">${subtotal.toLocaleString()}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-slate-600 dark:text-slate-400">Cargo por procesamiento</span>
              <span className="font-medium">${stripeFee.toLocaleString()}</span>
            </div>
            <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex justify-between">
              <span className="font-bold text-slate-800 dark:text-white">Total</span>
              <span className="font-bold text-primary text-lg font-display">${total.toLocaleString()} MXN</span>
            </div>
          </div>
        </div>

        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800 rounded-2xl p-4 flex gap-3">
          <span className="material-icons-outlined text-blue-500">lock</span>
          <div>
            <h5 className="font-bold text-blue-700 dark:text-blue-400 text-sm">Pago seguro con Stripe</h5>
            <p className="text-[11px] text-blue-600 dark:text-blue-500 mt-1">Serás redirigido a Stripe para completar tu pago de forma segura.</p>
          </div>
        </div>
      </main>

      <div className="fixed bottom-0 left-0 right-0 max-w-md mx-auto bg-white dark:bg-surface-dark border-t border-slate-100 dark:border-slate-800 px-6 pt-4 pb-10 flex flex-col gap-3 shadow-2xl z-50">
        <div className="flex justify-between items-center">
          <span className="text-slate-500 text-sm">Total a pagar</span>
          <span className="text-xl font-bold font-display">${total.toLocaleString()}</span>
        </div>
        <button
          onClick={handlePayment}
          disabled={isProcessing}
          className={`w-full text-white font-bold py-4 rounded-2xl shadow-lg flex items-center justify-center gap-2 transition-all ${
            isProcessing
              ? 'bg-slate-400 cursor-not-allowed'
              : 'bg-primary hover:bg-orange-600 active:scale-95'
          }`}
        >
          {isProcessing ? (
            <><span className="material-icons-outlined animate-spin">autorenew</span>Redirigiendo...</>
          ) : (
            <><span className="material-icons-outlined">lock</span>Pagar con Stripe</>
          )}
        </button>
      </div>
    </div>
  );
};

export default Checkout;
