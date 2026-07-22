import React, { useEffect, useState } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { useUser } from '../../context/UserContext';
import { toast } from 'sonner';
import { supabase } from '../../lib/supabaseClient';
import { getServicesByIds, getVenueById, PublicVenueService } from '../../src/services/venueService';
import { calcVenuePricing } from '../../src/utils/pricing';
import { computeCommissions, loadPlatformSettings, DEFAULT_SETTINGS, PlatformSettings, fmtMXN } from '../../src/utils/commissions';

const Checkout: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const location = useLocation();
  const { user } = useUser();
  const [isProcessing, setIsProcessing] = useState(false);
  const [venue, setVenue] = useState<any>(null);
  const [settings, setSettings] = useState<PlatformSettings>({ ...DEFAULT_SETTINGS });
  const [extras, setExtras] = useState<PublicVenueService[]>([]);

  // Booking details (from query params or defaults)
  const params = new URLSearchParams(location.search);
  const eventDate = params.get('date') || new Date().toISOString().split('T')[0];
  const startTime = params.get('start') || '19:00:00';
  const endTime = params.get('end') || '23:00:00';
  const hours = Number(params.get('hours') || 4);
  const guestCount = Number(params.get('guests') || 10);
  const serviceIds = (params.get('services') || '').split(',').filter(Boolean);
  // Snapshot enviado por el calendario (fuente de verdad si está disponible)
  const snapshotSubtotal = params.get('subtotal') ? Number(params.get('subtotal')) : null;
  const snapshotExtraHours = params.get('extra_hours') ? Number(params.get('extra_hours')) : null;
  void (params.get('slot_hours')); // reservado para futuro desglose detallado

  useEffect(() => {
    if (!id) return;
    // Traemos los campos crudos (base_price, included_hours, etc.) y además
    // resolvemos la imagen principal vía getVenueById para mostrar la foto.
    Promise.all([
      supabase.from('venues').select('*').eq('id', id).single(),
      getVenueById(id),
    ]).then(([{ data }, mapped]) => {
      if (!data) return;
      setVenue({
        ...data,
        image: mapped?.image || data.image || null,
      });
    });
    loadPlatformSettings(supabase).then(setSettings).catch(() => {});
  }, [id]);

  useEffect(() => {
    if (serviceIds.length === 0) { setExtras([]); return; }
    getServicesByIds(serviceIds).then(setExtras).catch(() => setExtras([]));
  }, [params.get('services')]);

  if (!venue) {
    return <div className="p-6 text-center">Cargando...</div>;
  }

  const usingFlexible = venue.base_price != null;
  // Resolución de horas incluidas: usamos el mayor entre included_hours y
  // min_hours para evitar que un valor antiguo (ej. 4h) muestre una base
  // menor al mínimo real configurado por el anfitrión.
  const includedHoursResolved =
    Math.max(Number(venue.included_hours) || 0, Number(venue.min_hours) || 0) || 5;
  const baseCapacityResolved =
    venue.base_capacity != null ? Number(venue.base_capacity) : 0;
  const computedBreakdown = usingFlexible
    ? calcVenuePricing({
        basePrice: Number(venue.base_price) || 0,
        baseCapacity: baseCapacityResolved,
        includedHours: includedHoursResolved,
        extraPersonPrice: Number(venue.extra_person_price) || 0,
        extraHourPrice: Number(venue.extra_hour_price) || 0,
        guests: guestCount,
        hours,
      })
    : null;
  // Si el calendario envió un snapshot, lo usamos como fuente de verdad para
  // el desglose visible y forzamos coincidencia de extra_hours.
  const breakdown = computedBreakdown
    ? {
        ...computedBreakdown,
        extraHours: snapshotExtraHours != null ? snapshotExtraHours : computedBreakdown.extraHours,
        extraHoursCost:
          snapshotExtraHours != null
            ? snapshotExtraHours * (Number(venue.extra_hour_price) || 0)
            : computedBreakdown.extraHoursCost,
      }
    : null;
  const computedSubtotal = breakdown ? breakdown.total : (Number(venue.price_per_hour) || 0) * hours;
  const subtotal = snapshotSubtotal != null && snapshotSubtotal > 0 ? snapshotSubtotal : computedSubtotal;
  const extrasTotal = extras.reduce((sum, e) => sum + e.price, 0);
  const basePrice = subtotal + extrasTotal;
  const cb = computeCommissions(basePrice, settings);
  const stripeFee = cb.stripeFee;
  const total = cb.userTotal;



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
          service_ids: serviceIds,
          extras_total: extrasTotal,
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
            {breakdown ? (
              <>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-600 dark:text-slate-400">Paquete base ({baseCapacityResolved} pers · {includedHoursResolved}h)</span>
                  <span className="font-medium">${breakdown.basePrice.toLocaleString()}</span>
                </div>
                {breakdown.extraPeopleCost > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-600 dark:text-slate-400">Personas extra ({breakdown.extraPeople} × {hours}h)</span>
                    <span className="font-medium">+${breakdown.extraPeopleCost.toLocaleString()}</span>
                  </div>
                )}
                {breakdown.extraHoursCost > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-600 dark:text-slate-400">Horas extra ({breakdown.extraHours})</span>
                    <span className="font-medium">+${breakdown.extraHoursCost.toLocaleString()}</span>
                  </div>
                )}
              </>
            ) : (
              <div className="flex justify-between text-sm">
                <span className="text-slate-600 dark:text-slate-400">Espacio (${venue.price_per_hour}/h × {hours}h)</span>
                <span className="font-medium">${subtotal.toLocaleString()}</span>
              </div>
            )}
            {extras.length > 0 && (
              <>
                <div className="pt-2">
                  <p className="text-[10px] uppercase tracking-wider text-slate-400 font-bold mb-2">Servicios extra</p>
                  {extras.map((e) => (
                    <div key={e.id} className="flex justify-between text-sm py-1">
                      <span className="text-slate-600 dark:text-slate-400 truncate pr-2">{e.name}</span>
                      <span className="font-medium flex-shrink-0">+${e.price.toLocaleString()}</span>
                    </div>
                  ))}
                </div>
              </>
            )}
            <div className="flex justify-between text-sm">
              <span className="text-slate-600 dark:text-slate-400">IVA ({settings.vat_percent}%)</span>
              <span className="font-medium">{fmtMXN(cb.vatOnBase + cb.vatOnUserCommission)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-slate-600 dark:text-slate-400">Cargo de servicio ({settings.user_commission_percent}%)</span>
              <span className="font-medium">{fmtMXN(cb.userCommission)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-slate-600 dark:text-slate-400">Cargo por procesamiento</span>
              <span className="font-medium">{fmtMXN(stripeFee)}</span>
            </div>

            <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex justify-between">
              <span className="font-bold text-slate-800 dark:text-white">Total</span>
              <span className="font-bold text-primary text-lg font-display">{fmtMXN(total)} MXN</span>
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
