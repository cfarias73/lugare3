# 🛡️ Puntos de Restauración y Registro de Versiones Estables

Este documento registra los puntos de control clave de la aplicación **Lugare**, sus commits correspondientes, tags de Git y los comandos para restaurar el sistema en caso de ser necesario.

---

## 📌 Punto de Restauración 1 (100% Funcional / Producción Play Store)

- **Identificador de Tag:** `v1.0.1-estable-playstore`
- **Rama de Respaldo:** `backup/v1.0.1-estable-playstore`
- **Commit SHA:** [`7e10a0b`](https://github.com/cfarias73/lugare3/commit/7e10a0b)
- **Fecha:** 4 de Noviembre de 2026
- **Estado:** ✅ **100% Funcional y Aprobado**

### Características incluidas y probadas en este punto:
1. **Google Play Store Release:**
   - Compilación `.aab` (versión `1.0.1`, `versionCode: 2`) firmada con `lugare-release-key.jks` enviada y en revisión en Google Play Console.
   - Permisos de ubicación en Android Manifest (`ACCESS_FINE_LOCATION`, `ACCESS_COARSE_LOCATION`).
2. **Tablero de Administración (Aprobación y Calidad de Espacios):**
   - Modal completo de inspección de calidad antes de aprobar negocios.
   - Modal de rechazo con captura obligatoria de `rejection_reason` (motivo de rechazo).
   - Migración en Supabase (`venues.rejection_reason`).
   - Badges de conteo de espacios pendientes de aprobación en menú lateral y métricas en Dashboard de Admin.
   - Blindaje en la vista pública de espacios para que los usuarios no puedan ver ni reservar espacios no aprobados.
3. **Interfaz Móvil:**
   - Menú de perfil de usuario con alto contraste (`text-slate-800`), fondo blanco sólido y ajuste a `safe-area-inset-bottom`.

---

## 🚀 Commits y Mejoras Posteriores (En fase de pruebas)

A partir del punto `7e10a0b`, el desarrollo continúa con mejoras y nuevas solicitudes:

| Commit | Descripción | Estado |
| :--- | :--- | :--- |
| `3ce85a5` | `fix(auth)`: Corrección de redirección y conflicto de tokens con `HashRouter` en recuperación de contraseña | 🟡 En pruebas de usuario |
| `6142be6` | `fix(admin)`: Corrección de `profiles.email` en Supabase y sincronización para desbloquear Usuarios, Anfitriones y Espacios | 🟢 Migración aplicada y en pruebas |
| *Próximos* | Nuevos ajustes solicitados por el cliente en el tablero de administración | ⏳ Pendiente |

---

## 🔄 ¿Cómo Restaurar a este Punto Estable?

Si en algún momento deseas regresar el código exactamente a como estaba en el punto 100% funcional:

### Opción A: Solo inspeccionar o compilar el punto estable
```bash
git checkout v1.0.1-estable-playstore
```

### Opción B: Descartar cambios posteriores y dejar `main` exactamente en el punto estable
```bash
git checkout main
git reset --hard v1.0.1-estable-playstore
git push origin main --force
```

### Opción C: Revertir un commit específico manteniendo el historial
```bash
git revert <hash_del_commit>
git push origin main
```
