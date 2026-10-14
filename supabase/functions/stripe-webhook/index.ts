// =====================================================
// PASO 3: Edge Function "stripe-webhook"
// Supabase Dashboard → Edge Functions → Deploy a new function
// Nombre: stripe-webhook
// IMPORTANTE: Marca la opción "Verify JWT" como DESACTIVADA
// (este endpoint lo llama Stripe, no un usuario logueado)
// =====================================================

import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14.21.0?target=deno";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

serve(async (req) => {
  const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY")!, {
    apiVersion: "2024-06-20",
  });

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );

  const signature = req.headers.get("stripe-signature");
  if (!signature) return new Response("No signature", { status: 400 });

  const body = await req.text();
  let event: Stripe.Event;

  try {
    event = await stripe.webhooks.constructEventAsync(
      body,
      signature,
      Deno.env.get("STRIPE_WEBHOOK_SECRET")!
    );
  } catch (err) {
    console.error("Signature verification failed:", err);
    return new Response(`Webhook Error: ${(err as Error).message}`, { status: 400 });
  }

  console.log("Stripe event:", event.type);

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        const bookingId = session.metadata?.booking_id;

        if (bookingId) {
          await supabase
            .from("bookings")
            .update({ status: "confirmed" })
            .eq("id", bookingId);

          await supabase
            .from("payments")
            .update({
              status: "paid",
              stripe_payment_intent: session.payment_intent as string,
              updated_at: new Date().toISOString(),
            })
            .eq("stripe_session_id", session.id);
        } else if (session.metadata?.venue_id && session.metadata?.user_id) {
          const meta = session.metadata;
          const venueId = meta.venue_id;
          const userId = meta.user_id;
          const eventDate = meta.event_date;
          const startTime = meta.start_time;
          const endTime = meta.end_time;
          const guestCount = Number(meta.guest_count) || 1;
          const totalPrice = Number(meta.user_total) || ((session.amount_total || 0) / 100);

          // Verificar si ya se insertó para evitar duplicados si el webhook se reintenta
          const { data: existingPayment } = await supabase
            .from("payments")
            .select("id, booking_id")
            .eq("stripe_session_id", session.id)
            .maybeSingle();

          if (!existingPayment) {
            // 1. Crear reserva confirmada
            const { data: newBooking, error: bookingErr } = await supabase
              .from("bookings")
              .insert({
                venue_id: venueId,
                user_id: userId,
                event_date: eventDate,
                start_time: startTime,
                end_time: endTime,
                guest_count: guestCount,
                total_price: totalPrice,
                status: "confirmed",
              })
              .select("id")
              .single();

            if (bookingErr) {
              console.error("Error creating booking from webhook:", bookingErr);
            } else if (newBooking) {
              // 2. Crear registro de pago
              const { error: paymentErr } = await supabase
                .from("payments")
                .insert({
                  booking_id: newBooking.id,
                  stripe_session_id: session.id,
                  stripe_payment_intent: (session.payment_intent as string) || null,
                  amount_total: totalPrice,
                  currency: session.currency || "mxn",
                  status: "paid",
                });

              if (paymentErr) {
                console.error("Error creating payment record from webhook:", paymentErr);
              }

              // 3. Notificar al anfitrión
              try {
                const { data: venue } = await supabase
                  .from("venues")
                  .select("name, provider_id")
                  .eq("id", venueId)
                  .maybeSingle();

                if (venue?.provider_id) {
                  await supabase.from("notifications").insert({
                    user_id: venue.provider_id,
                    title: "Nueva reserva confirmada",
                    message: `Se ha pagado y confirmado una reserva para ${venue.name} el ${eventDate}.`,
                    type: "info",
                    link: "/provider/received-bookings",
                  });
                }
              } catch (notifErr) {
                console.error("Error sending notification to provider:", notifErr);
              }
            }
          }
        }
        break;
      }

      case "payment_intent.payment_failed": {
        const intent = event.data.object as Stripe.PaymentIntent;
        await supabase
          .from("payments")
          .update({ status: "failed", updated_at: new Date().toISOString() })
          .eq("stripe_payment_intent", intent.id);
        break;
      }
    }

    return new Response(JSON.stringify({ received: true }), {
      headers: { "Content-Type": "application/json" },
      status: 200,
    });
  } catch (err) {
    console.error("Handler error:", err);
    return new Response(JSON.stringify({ error: (err as Error).message }), {
      status: 500,
    });
  }
});
