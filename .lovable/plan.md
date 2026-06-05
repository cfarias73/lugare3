# Precios flexibles por espacio

## Objetivo
Permitir al anfitrión configurar: precio base, capacidad base/máxima, costo por persona extra (por hora), horas incluidas y costo por hora extra. El sistema calculará automáticamente el total en el checkout según invitados y horas.

## Cambios

### 1. Base de datos (migración)
Agregar columnas a `venues`:
- `base_price` numeric — precio base del paquete
- `base_capacity` int — personas incluidas
- `max_capacity` int — capacidad máxima (reemplaza/coexiste con `capacity`)
- `included_hours` int — horas incluidas en el precio base
- `extra_person_price` numeric — costo por persona extra por hora
- `extra_hour_price` numeric — ya existe; se reutiliza

Mantener `price_per_hour` por compatibilidad (se calcula como `base_price / included_hours` si no se usa el modelo nuevo).

### 2. Alta de espacio (`pages/provider/CreateSpace.tsx` + contexto)
Reemplazar Step 2 (precios) por:
- Precio base ($)
- Capacidad base (personas)
- Capacidad máxima (personas) — validación: ≥ base
- Horas incluidas
- Persona extra ($ por persona por hora)
- Hora extra ($)

Validaciones: todos ≥ 0/1, sin negativos, max ≥ base.

### 3. Cálculo de precio (utilidad nueva `src/utils/pricing.ts`)
```
function calcTotal({ basePrice, baseCapacity, includedHours, extraPersonPrice, extraHourPrice, guests, hours }) {
  const extraPeople = Math.max(0, guests - baseCapacity);
  const extraHours  = Math.max(0, hours - includedHours);
  const peopleCost  = extraPeople * extraPersonPrice * hours;
  const hoursCost   = extraHours * extraHourPrice;
  return basePrice + peopleCost + hoursCost;
}
```

### 4. Checkout (`pages/user/Checkout.tsx`)
Mostrar desglose: paquete base, cargo por personas extra, cargo por horas extra, servicios extra, fee Stripe, total. Usar la utilidad anterior.

### 5. Detalle del venue (`pages/user/VenueDetail.tsx` / `BookingCalendar`)
Mostrar el paquete base y reglas de cobro para que el usuario entienda antes de reservar.

### 6. Edge function `create-checkout`
Recalcular total en el servidor con los mismos parámetros (no confiar en el cliente).

## Fuera de alcance (este turno)
- Migrar datos históricos de espacios existentes (se llenarán con valores por defecto: base_price = price_per_hour * min_hours, base_capacity = capacity, max_capacity = capacity, included_hours = min_hours, extra_person_price = 0).

## Confirmación
¿Apruebas el plan para proceder con la migración SQL + cambios de UI/checkout?
