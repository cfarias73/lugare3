// @ts-nocheck
// Supabase Edge Function: create-checkout
// Deploy con:  supabase functions deploy create-checkout
//
// Variables de entorno requeridas (en Supabase → Project → Edge Functions → Secrets):
//   STRIPE_SECRET_KEY       — sk_test_... o sk_live_...
//   SUPABASE_URL            — autoinyectado
//   SUPABASE_SERVICE_ROLE_KEY — autoinyectado
//   SUPABASE_ANON_KEY       — autoinyectado

// deno-lint-ignore-file no-explicit-any
import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import Stripe from "https://esm.sh/stripe@14.21.0?target=deno";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });

// === Cálculo de precio flexible ============================================
interface PricingArgs {
  basePrice: number;
  baseCapacity: number;
  includedHours: number;
  extraPersonPrice: number;
  extraHourPrice: number;
  guests: number;
  hours: number;
}

function calcVenueTotal(p: PricingArgs): number {
  const extraPeople = Math.max(0, (p.guests || 0) - (p.baseCapacity || 0));
  const extraHours = Math.max(0, (p.hours || 0) - (p.includedHours || 0));
  const peopleCost = extraPeople * (p.extraPersonPrice || 0) * (p.hours || 0);
  const hoursCost = extraHours * (p.extraHourPrice || 0);
  return (p.basePrice || 0) + peopleCost + hoursCost;
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    if (!stripeKey) return json({ error: "STRIPE_SECRET_KEY no configurada" }, 500);

    // Autenticación: validar usuario
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) return json({ error: "No autorizado" }, 401);

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseAnon = Deno.env.get("SUPABASE_ANON_KEY")!;
    const supabaseService = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    const userClient = createClient(supabaseUrl, supabaseAnon, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: userData, error: userErr } = await userClient.auth.getUser();
    if (userErr || !userData.user) return json({ error: "Sesión inválida" }, 401);
    const user = userData.user;

    // Cliente con privilegios (para leer venues sin RLS)
    const admin = createClient(supabaseUrl, supabaseService);

    const body = await req.json();
    const {
      venue_id,
      event_date,
      start_time,
      end_time,
      guest_count,
      hours,
      service_ids = [],
      extras_total: extrasTotalFromClient = 0,
      origin,
    } = body ?? {};

    if (!venue_id || !event_date || !start_time || !end_time || !hours) {
      return json({ error: "Faltan datos de la reserva" }, 400);
    }

    // 1) Leer venue (incluye campos de precio flexible)
    const { data: venue, error: venueErr } = await admin
      .from("venues")
      .select(
        "id, name, provider_id, price_per_hour, min_hours, extra_hour_price, base_price, base_capacity, max_capacity, included_hours, extra_person_price"
      )
      .eq("id", venue_id)
      .single();
    if (venueErr || !venue) return json({ error: "Espacio no encontrado" }, 404);

    const guests = Number(guest_count) || 0;
    const hrs = Number(hours) || 0;

    // Validación capacidad
    if (venue.max_capacity != null && guests > Number(venue.max_capacity)) {
      return json(
        { error: `La capacidad máxima del espacio es ${venue.max_capacity} personas` },
        400
      );
    }

    // 2) Calcular subtotal del venue (flexible si está disponible)
    // El fallback de includedHours toma el mayor entre included_hours y min_hours
    // para mantener congruencia con el calendario y el checkout del cliente.
    let venueSubtotal: number;
    if (venue.base_price != null) {
      const includedHoursResolved =
        Math.max(Number(venue.included_hours) || 0, Number(venue.min_hours) || 0) || 5;
      venueSubtotal = calcVenueTotal({
        basePrice: Number(venue.base_price) || 0,
        baseCapacity: Number(venue.base_capacity) || 0,
        includedHours: includedHoursResolved,
        extraPersonPrice: Number(venue.extra_person_price) || 0,
        extraHourPrice: Number(venue.extra_hour_price) || 0,
        guests,
        hours: hrs,
      });
    } else {
      venueSubtotal = (Number(venue.price_per_hour) || 0) * hrs;
    }

    // 3) Servicios extra: recalcular en servidor (no confiar en el cliente)
    let extrasTotal = 0;
    let services: Array<{ id: string; name: string; price: number }> = [];
    if (Array.isArray(service_ids) && service_ids.length > 0) {
      const { data: svc, error: svcErr } = await admin
        .from("venue_services")
        .select("id, name, price")
        .in("id", service_ids)
        .eq("venue_id", venue_id);
      if (svcErr) return json({ error: "Error al cargar servicios" }, 500);
      services = (svc || []).map((s: any) => ({
        id: s.id,
        name: s.name,
        price: Number(s.price) || 0,
      }));
      extrasTotal = services.reduce((sum, s) => sum + s.price, 0);
    }

    // Si llegan extras_total del cliente, lo ignoramos (defensa en profundidad)
    void extrasTotalFromClient;

    const basePrice = venueSubtotal + extrasTotal;

    // Cargar tasas configurables desde platform_settings (sin hardcodear)
    const { data: settingsRow } = await admin
      .from("platform_settings")
      .select("*")
      .limit(1)
      .maybeSingle();

    const s = {
      host_commission_percent: Number(settingsRow?.host_commission_percent ?? 3.5),
      user_commission_percent: Number(settingsRow?.user_commission_percent ?? 14),
      vat_percent: Number(settingsRow?.vat_percent ?? 16),
      vat_withholding_percent: Number(settingsRow?.vat_withholding_percent ?? 0),
      isr_withholding_percent: Number(settingsRow?.isr_withholding_percent ?? 0),
      other_withholding_percent: Number(settingsRow?.other_withholding_percent ?? 0),
      stripe_percent: Number(settingsRow?.stripe_percent ?? 3.6),
      stripe_fixed: Number(settingsRow?.stripe_fixed ?? 3),
    };

    // Motor de cálculo — DEBE coincidir con src/utils/commissions.ts
    const vatOnBase = basePrice * s.vat_percent / 100;
    const hostCommission = basePrice * s.host_commission_percent / 100;
    const userCommission = basePrice * s.user_commission_percent / 100;
    const vatOnHostCommission = hostCommission * s.vat_percent / 100;
    const vatOnUserCommission = userCommission * s.vat_percent / 100;
    const vatOnLugareCommission = vatOnHostCommission + vatOnUserCommission;
    const vatWithheld = (vatOnBase + vatOnLugareCommission) * s.vat_withholding_percent / 100;
    const isrWithheld = basePrice * s.isr_withholding_percent / 100;
    const otherWithheld = basePrice * s.other_withholding_percent / 100;
    const subtotalBeforeStripe = basePrice + vatOnBase + userCommission + vatOnUserCommission;
    const stripeFee = subtotalBeforeStripe * s.stripe_percent / 100 + s.stripe_fixed;
    const userTotal = subtotalBeforeStripe + stripeFee;
    const hostPayout = basePrice + vatOnBase - hostCommission - vatOnHostCommission - (vatWithheld + isrWithheld + otherWithheld);
    const lugareNet = hostCommission + userCommission + vatOnLugareCommission - stripeFee;

    // 4) Crear sesión de Stripe Checkout
    const stripe = new Stripe(stripeKey, { apiVersion: "2024-06-20" });

    const reqOrigin =
      origin ||
      req.headers.get("origin") ||
      req.headers.get("referer") ||
      "";

    const lineItems: Stripe.Checkout.SessionCreateParams.LineItem[] = [
      {
        price_data: {
          currency: "mxn",
          unit_amount: Math.round(venueSubtotal * 100),
          product_data: {
            name: venue.name,
            description: `${guests} personas · ${hrs}h · ${event_date}`,
          },
        },
        quantity: 1,
      },
      ...services.map((s2) => ({
        price_data: {
          currency: "mxn",
          unit_amount: Math.round(s2.price * 100),
          product_data: { name: `Servicio: ${s2.name}` },
        },
        quantity: 1,
      })),
      {
        price_data: {
          currency: "mxn",
          unit_amount: Math.round((vatOnBase + userCommission + vatOnUserCommission) * 100),
          product_data: { name: `IVA + cargo de servicio (${s.user_commission_percent}%)` },
        },
        quantity: 1,
      },
      {
        price_data: {
          currency: "mxn",
          unit_amount: Math.round(stripeFee * 100),
          product_data: { name: "Cargo por procesamiento" },
        },
        quantity: 1,
      },
    ];

    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      payment_method_types: ["card"],
      line_items: lineItems,
      customer_email: user.email ?? undefined,
      success_url: `${reqOrigin}/user/payment-success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${reqOrigin}/user/checkout/${venue_id}`,
      metadata: {
        venue_id,
        user_id: user.id,
        event_date,
        start_time,
        end_time,
        guest_count: String(guests),
        hours: String(hrs),
        base_price: basePrice.toFixed(2),
        vat_on_base: vatOnBase.toFixed(2),
        host_commission: hostCommission.toFixed(2),
        user_commission: userCommission.toFixed(2),
        vat_on_commission: vatOnLugareCommission.toFixed(2),
        vat_withheld: vatWithheld.toFixed(2),
        isr_withheld: isrWithheld.toFixed(2),
        other_withheld: otherWithheld.toFixed(2),
        stripe_fee: stripeFee.toFixed(2),
        host_payout: hostPayout.toFixed(2),
        lugare_net: lugareNet.toFixed(2),
        user_total: userTotal.toFixed(2),
        service_ids: (service_ids || []).join(","),
      },
    });

    return json({ url: session.url, total: userTotal });
  } catch (e: any) {
    console.error("create-checkout error", e);
    return json({ error: e?.message ?? "Error interno" }, 500);
  }
});
