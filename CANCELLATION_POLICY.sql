-- Modelo de cancelaciones Lugare
-- Ejecutar en Supabase → SQL Editor

-- 1) Política por espacio
alter table public.venues
  add column if not exists cancellation_type text not null default 'non_refundable',
  add column if not exists cancellation_days integer,
  add column if not exists cancellation_tiers jsonb;

do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'venues_cancellation_type_check'
  ) then
    alter table public.venues
      add constraint venues_cancellation_type_check
      check (cancellation_type in ('non_refundable', 'flexible', 'custom'));
  end if;
end $$;

-- 2) Datos de cancelación en la reserva
alter table public.bookings
  add column if not exists cancelled_at timestamptz,
  add column if not exists cancelled_by text,
  add column if not exists cancellation_reason text,
  add column if not exists refund_percent numeric default 0,
  add column if not exists refund_amount numeric default 0;

-- 3) El usuario puede cancelar SU propia reserva
drop policy if exists "Users cancel own bookings" on public.bookings;
create policy "Users cancel own bookings"
  on public.bookings
  for update
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);
