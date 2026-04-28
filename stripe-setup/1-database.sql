-- =====================================================
-- PASO 1: Ejecuta TODO esto en Supabase SQL Editor
-- Dashboard → SQL Editor → New query → Pega → Run
-- =====================================================

-- Tabla de configuración de plataforma (% comisión)
CREATE TABLE IF NOT EXISTS public.platform_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  commission_percent numeric NOT NULL DEFAULT 10,
  updated_at timestamptz DEFAULT now(),
  updated_by uuid REFERENCES auth.users(id)
);

ALTER TABLE public.platform_settings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can read settings" ON public.platform_settings;
CREATE POLICY "Anyone can read settings"
  ON public.platform_settings FOR SELECT USING (true);

DROP POLICY IF EXISTS "Only admins update settings" ON public.platform_settings;
CREATE POLICY "Only admins update settings"
  ON public.platform_settings FOR UPDATE
  USING (public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Only admins insert settings" ON public.platform_settings;
CREATE POLICY "Only admins insert settings"
  ON public.platform_settings FOR INSERT
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Insert inicial 10%
INSERT INTO public.platform_settings (commission_percent)
SELECT 10
WHERE NOT EXISTS (SELECT 1 FROM public.platform_settings);

-- =====================================================
-- Tabla de pagos (registro de cada transacción Stripe)
-- =====================================================
CREATE TABLE IF NOT EXISTS public.payments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id uuid REFERENCES public.bookings(id) ON DELETE CASCADE,
  user_id uuid REFERENCES auth.users(id),
  stripe_session_id text UNIQUE,
  stripe_payment_intent text,
  amount_subtotal numeric,
  stripe_fee numeric,
  amount_total numeric,
  commission_amount numeric,
  host_payout numeric,
  currency text DEFAULT 'mxn',
  status text DEFAULT 'pending',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users see own payments" ON public.payments;
CREATE POLICY "Users see own payments"
  ON public.payments FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Admins see all payments" ON public.payments;
CREATE POLICY "Admins see all payments"
  ON public.payments FOR SELECT
  USING (public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Hosts see venue payments" ON public.payments;
CREATE POLICY "Hosts see venue payments"
  ON public.payments FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.bookings b
      JOIN public.venues v ON v.id = b.venue_id
      WHERE b.id = payments.booking_id
        AND v.provider_id = auth.uid()
    )
  );

-- Índices útiles
CREATE INDEX IF NOT EXISTS idx_payments_booking ON public.payments(booking_id);
CREATE INDEX IF NOT EXISTS idx_payments_user ON public.payments(user_id);
CREATE INDEX IF NOT EXISTS idx_payments_session ON public.payments(stripe_session_id);
