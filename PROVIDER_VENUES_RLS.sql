-- Permisos de gestión de espacios para anfitriones.
-- Ejecutar en Supabase SQL Editor. Cada política limita el acceso al
-- espacio cuyo provider_id coincide con el usuario autenticado.

-- Los usuarios pueden consultar su propio rol y registrarse como cliente o
-- anfitrión, pero nunca asignarse el rol de administrador.
DROP POLICY IF EXISTS "Lugare users can view own roles" ON public.user_roles;
CREATE POLICY "Lugare users can view own roles" ON public.user_roles
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Lugare users can assign own customer or provider role" ON public.user_roles;
CREATE POLICY "Lugare users can assign own customer or provider role" ON public.user_roles
  FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid() AND role IN ('user', 'provider'));

-- Completa los roles de anfitrión de cuentas existentes que se registraron
-- como anfitrión antes de que existiera la política de autoasignación.
INSERT INTO public.user_roles (user_id, role)
SELECT auth_user.id, 'provider'
FROM auth.users AS auth_user
WHERE auth_user.raw_user_meta_data ->> 'role' = 'provider'
  AND NOT EXISTS (
    SELECT 1
    FROM public.user_roles AS existing_role
    WHERE existing_role.user_id = auth_user.id
      AND existing_role.role = 'provider'
  )
ON CONFLICT DO NOTHING;

DROP POLICY IF EXISTS "Lugare providers can view own venues" ON public.venues;
CREATE POLICY "Lugare providers can view own venues" ON public.venues
  FOR SELECT TO authenticated
  USING (provider_id = auth.uid() AND public.has_role(auth.uid(), 'provider'));

DROP POLICY IF EXISTS "Lugare providers can create own venues" ON public.venues;
CREATE POLICY "Lugare providers can create own venues" ON public.venues
  FOR INSERT TO authenticated
  WITH CHECK (provider_id = auth.uid() AND public.has_role(auth.uid(), 'provider'));

DROP POLICY IF EXISTS "Lugare providers can update own venues" ON public.venues;
CREATE POLICY "Lugare providers can update own venues" ON public.venues
  FOR UPDATE TO authenticated
  USING (provider_id = auth.uid() AND public.has_role(auth.uid(), 'provider'))
  WITH CHECK (provider_id = auth.uid() AND public.has_role(auth.uid(), 'provider'));

DROP POLICY IF EXISTS "Lugare providers can delete own venues" ON public.venues;
CREATE POLICY "Lugare providers can delete own venues" ON public.venues
  FOR DELETE TO authenticated
  USING (provider_id = auth.uid() AND public.has_role(auth.uid(), 'provider'));

DROP POLICY IF EXISTS "Lugare providers can view own venue images" ON public.venue_images;
CREATE POLICY "Lugare providers can view own venue images" ON public.venue_images
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.venues
      WHERE venues.id = venue_images.venue_id
        AND venues.provider_id = auth.uid()
        AND public.has_role(auth.uid(), 'provider')
    )
  );

DROP POLICY IF EXISTS "Lugare providers can add own venue images" ON public.venue_images;
CREATE POLICY "Lugare providers can add own venue images" ON public.venue_images
  FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.venues
      WHERE venues.id = venue_images.venue_id
        AND venues.provider_id = auth.uid()
        AND public.has_role(auth.uid(), 'provider')
    )
  );

DROP POLICY IF EXISTS "Lugare providers can delete own venue images" ON public.venue_images;
CREATE POLICY "Lugare providers can delete own venue images" ON public.venue_images
  FOR DELETE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.venues
      WHERE venues.id = venue_images.venue_id
        AND venues.provider_id = auth.uid()
        AND public.has_role(auth.uid(), 'provider')
    )
  );
