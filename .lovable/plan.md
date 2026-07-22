# Sistema de comisiones y retenciones configurable

## Objetivo
Que **todas** las tasas (comisiones, IVA, retenciones, Stripe) vivan en `platform_settings` y sean editables desde `/admin/settings`. Ninguna tasa quedará hardcodeada en frontend, edge function ni servicios.

## 1. Base de datos (SQL a ejecutar)

Ampliar `platform_settings` con columnas nuevas (numeric, con defaults) y un solo registro global:

```sql
ALTER TABLE public.platform_settings
  ADD COLUMN IF NOT EXISTS host_commission_percent   numeric NOT NULL DEFAULT 3.5,
  ADD COLUMN IF NOT EXISTS user_commission_percent   numeric NOT NULL DEFAULT 14,
  ADD COLUMN IF NOT EXISTS vat_percent               numeric NOT NULL DEFAULT 16,
  ADD COLUMN IF NOT EXISTS vat_withholding_percent   numeric NOT NULL DEFAULT 0,   -- % del IVA retenido
  ADD COLUMN IF NOT EXISTS isr_withholding_percent   numeric NOT NULL DEFAULT 0,   -- % ISR sobre base host
  ADD COLUMN IF NOT EXISTS other_withholding_percent numeric NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS other_withholding_label   text    NOT NULL DEFAULT 'Otra retención',
  ADD COLUMN IF NOT EXISTS stripe_percent            numeric NOT NULL DEFAULT 3.6,
  ADD COLUMN IF NOT EXISTS stripe_fixed              numeric NOT NULL DEFAULT 3;
-- commission_percent existente se conserva por compatibilidad
```

## 2. Motor de cálculo (nuevo)

Crear `src/utils/commissions.ts` con función pura `computeCommissions(basePrice, settings)` que devuelve:

- `basePrice` — precio del espacio
- `vatOnBase` — IVA del espacio
- `hostCommission` — % anfitrión sobre base
- `userCommission` — % usuario sobre base (cargo visible al cliente)
- `vatOnLugareCommission` — IVA sobre (hostCommission + userCommission)
- `vatWithheld`, `isrWithheld`, `otherWithheld`
- `stripeFee` — % + fijo sobre total cobrado al usuario
- `userTotal` — lo que paga el usuario = base + IVA base + userCommission + IVA userCommission + stripe (según configuración)
- `hostPayout` — neto anfitrión = base + IVA base − hostCommission − IVA hostCommission − retenciones
- `lugareNet` — comisiones + IVA − stripe
- `taxesWithheldTotal`

## 3. Panel admin (`pages/admin/Settings.tsx`)

Reescribir el formulario para editar **todos** los porcentajes, agrupados en secciones:
- Comisiones (host, usuario)
- Impuestos (IVA)
- Retenciones (IVA, ISR, otra con etiqueta editable)
- Pasarela (Stripe % y fijo)

Simulador en vivo con reserva ejemplo de $1,000 que usa `computeCommissions` y muestra el desglose completo.

## 4. Checkout usuario (`pages/user/Checkout.tsx`)

- Leer settings completos, calcular con `computeCommissions`.
- Mostrar desglose visible al usuario: base, IVA, comisión de servicio (userCommission + su IVA), cargo Stripe, Total.
- Retenciones/ISR/host commission **no** se muestran al usuario final (son internas), sí en admin/finance.

## 5. Edge function `supabase/functions/create-checkout/index.ts`

- Leer `platform_settings` en el handler.
- Usar el mismo motor (portado a Deno) para calcular `userTotal`.
- Guardar en metadata: `base_price`, `host_commission`, `user_commission`, `vat_base`, `vat_commission`, `vat_withheld`, `isr_withheld`, `other_withheld`, `stripe_fee`, `host_payout`, `lugare_net`.

## 6. Panel Finanzas (`pages/admin/Finance.tsx`)

- Eliminar `COMMISSION_RATES` hardcodeado de `adminService.ts`.
- Cargar `platform_settings`, recalcular con `computeCommissions` sobre `total_price` (o si existe, usar metadata guardada).
- Nuevas tarjetas: ingresos brutos, comisión host, comisión usuario, IVA cobrado, retenciones, Stripe, neto Lugare, pago anfitriones.

## Notas técnicas

- El motor vive en `src/utils/commissions.ts` y se **duplica** en la edge function (Deno no puede importar de `src/`) — se documenta la duplicación con comentario claro.
- `commission_percent` legacy queda como columna sin uso activo para no romper filas existentes.
- Todo el cambio es aditivo en DB (no elimina columnas).

## Alcance no incluido

- No se cambia UI del anfitrión (verá su `hostPayout` como neto en su dashboard existente si aplica, pero no se rediseña).
- No se agregan reportes fiscales/CFDI, solo cálculo y visualización.
