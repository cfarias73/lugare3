// =====================================================
// PASO 2: Edge Function "create-checkout"
// Supabase Dashboard → Edge Functions → Deploy a new function
// Nombre: create-checkout
// Pega todo este código y deploy
// =====================================================

import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14.21.0?target=deno";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY")!, {
      apiVersion: "2024-06-20",
    });

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("No authorization");

    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: userErr } = await supabase.auth.getUser(token);
    if (userErr || !userData.user) throw new Error("Invalid user");
    const user = userData.user;

    const body = await req.json();
    const { venue_id, event_date, start_time, end_time, guest_count, hours, origin } = body;

    if (!venue_id || !event_date || !hours) {
      throw new Error("Missing required fields");
    }

    // 1. Get venue
    const { data: venue, error: venueErr } = await supabase
      .from("venues")
      .select("*")
      .eq("id", venue_id)
      .single();
    if (venueErr || !venue) throw new Error("Venue not found");

    // 2. Get commission %
    const { data: settings } = await supabase
      .from("platform_settings")
      .select("commission_percent")
      .limit(1)
      .single();
    const commissionPercent = settings?.commission_percent ?? 10;

    // 3. Calculate amounts (MXN, in centavos)
    const subtotal = Math.round(venue.price_per_hour * hours * 100); // centavos
    // Stripe fee MX: 3.6% + $3 MXN per transaction
    const stripeFee = Math.round(subtotal * 0.036 + 300);
    const totalCharge = subtotal + stripeFee;
    const commission = Math.round(subtotal * (commissionPercent / 100));
    const hostPayout = subtotal - commission;

    // 4. Create pending booking
    const { data: booking, error: bookErr } = await supabase
      .from("bookings")
      .insert({
        user_id: user.id,
        venue_id,
        event_date,
        start_time,
        end_time,
        guest_count: guest_count || 1,
        total_price: totalCharge / 100,
        status: "pending_payment",
      })
      .select()
      .single();
    if (bookErr) throw bookErr;

    // 5. Create Stripe Checkout Session
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      mode: "payment",
      customer_email: user.email,
      line_items: [
        {
          price_data: {
            currency: "mxn",
            product_data: {
              name: venue.name,
              description: `Reserva ${event_date} (${hours}h)`,
            },
            unit_amount: subtotal,
          },
          quantity: 1,
        },
        {
          price_data: {
            currency: "mxn",
            product_data: {
              name: "Cargo por procesamiento",
              description: "Comisión de pago seguro",
            },
            unit_amount: stripeFee,
          },
          quantity: 1,
        },
      ],
      success_url: `${origin}/#/user/payment-success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/#/user/checkout/${venue_id}`,
      metadata: {
        booking_id: booking.id,
        user_id: user.id,
        venue_id,
        commission: String(commission),
        host_payout: String(hostPayout),
      },
    });

    // 6. Insert pending payment record
    await supabase.from("payments").insert({
      booking_id: booking.id,
      user_id: user.id,
      stripe_session_id: session.id,
      amount_subtotal: subtotal / 100,
      stripe_fee: stripeFee / 100,
      amount_total: totalCharge / 100,
      commission_amount: commission / 100,
      host_payout: hostPayout / 100,
      status: "pending",
    });

    return new Response(JSON.stringify({ url: session.url, session_id: session.id }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (err) {
    console.error("create-checkout error:", err);
    return new Response(JSON.stringify({ error: (err as Error).message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 400,
    });
  }
});
