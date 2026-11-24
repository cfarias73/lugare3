# Temas complejos a consultar y confirmar con el cliente

Este documento concentra los puntos técnicos o operativos que requieren decisión del cliente, datos de sus cuentas de publicación o validación en producción antes de implementarse o liberarse.

---

## 1. Abrir enlaces compartidos directo en la app (Universal Links y App Links)

**Contexto:** Actualmente los enlaces compartidos (`https://www.lugare.mx/#/user/venue/...`, `/#/invite/...`) abren en el navegador del teléfono en lugar de abrir directamente la app instalada.

**Por qué requiere coordinación:**
- No se resuelve solo en código web: requiere configurar **Universal Links** (iOS) y **App Links** (Android), publicar archivos de verificación en el dominio y **subir una nueva versión compilada a App Store y Google Play**.

**Qué necesitamos confirmar / obtener:**
1. **Apple Team ID** (código de 10 caracteres en *Apple Developer Portal*) para generar `apple-app-site-association`.
2. **Huella SHA-256 de firma de Android** (en *Google Play Console → Integridad de la app → Firma de aplicaciones*) para generar `assetlinks.json`.
3. **Dominios oficiales:** confirmar si se deben soportar tanto `www.lugare.mx` como `lugare.mx`.
4. **Alcance por app:** confirmar si los enlaces públicos (espacios e invitaciones) deben abrir únicamente la app de usuarios (`com.lugare.user`) o si algún enlace debe abrir la app de anfitriones (`com.lugare.host`).
5. **Comportamiento si no tiene la app:** en web ya se habilitó la galería completa de fotos en el detalle del espacio para quienes aún no descargan la app.

---

## 2. Validación de permisos de Administrador en Supabase (`ADMIN_RLS.sql`)

**Contexto:** Si en `www.lugare.mx/#/admin/finance` o en **Pagos y retenciones** aparecen totales en `$0.00` o faltan registros tras desplegar la última versión web, la causa suele ser que faltan políticas RLS de lectura/escritura para el rol `admin` en Supabase.

**Qué confirmar:**
- Verificar en el *SQL Editor* de Supabase producción que las políticas de `ADMIN_RLS.sql` (sobre `bookings`, `venues`, `profiles`, `reviews` y `user_roles`) estén aplicadas correctamente.

---

## 3. Tasas fiscales y desglose para facturas de retenciones mensuales

**Contexto:** El panel de **Pagos y retenciones** ya permite filtrar por mes y anfitrión, ver totales de retenciones/neto y exportar a Excel para contabilidad.

**Qué confirmar con el equipo contable:**
- Que los porcentajes configurados en `/admin/settings` (IVA, comisión de anfitrión, comisión de usuario, % de retención de IVA, % de ISR, otras retenciones y comisión Stripe) coinciden exactamente con los criterios fiscales con los que emiten las facturas mensuales de retenciones.
- Si requieren algún campo fiscal adicional en el Excel exportado (por ejemplo, RFC o razón social del anfitrión, que actualmente no se solicita en el perfil).

---

## 4. Reseñas: sub-calificaciones y bucket de fotos

**Contexto:** Se corrigió el envío de reseñas (`booking_id`) y se habilitó la visualización de reseñas al tocar la estrella en el detalle del espacio.

**Qué confirmar:**
- Validar que el bucket `review-photos` en Supabase Storage tenga permisos de subida para usuarios autenticados y lectura pública en producción.
- Confirmar si en una siguiente iteración desean guardar y mostrar en base de datos las calificaciones por aspecto (*Limpieza, Ubicación, Atención del anfitrión, Calidad/Precio, Instalaciones*), ya que actualmente la tabla `reviews` solo almacena la calificación general, comentario y fotos.

---

## 5. Ventana de liberación (Web + App Store + Google Play)

**Qué coordinar:**
- Confirmar el despliegue en Vercel (`www.lugare.mx`) con los últimos cambios de `main` (Finanzas, Retenciones Excel y galería de fotos en web).
- Definir cuándo se generan y suben los nuevos binarios de `ios-user`, `android-user`, `ios-host` y `android-host` a App Store Connect y Google Play Console para liberar las correcciones móviles.
