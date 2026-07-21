-- =====================================================================
-- ADMIN RLS - ejecuta este SQL en Supabase (SQL Editor) UNA VEZ.
-- Sin estas políticas, el panel de admin falla silenciosamente:
-- delete/update retornan success con 0 filas afectadas porque RLS
-- oculta las filas de otros usuarios.
-- =====================================================================

-- PROFILES
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;
CREATE POLICY "Admins can view all profiles" ON public.profiles
  FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Admins can update any profile" ON public.profiles;
CREATE POLICY "Admins can update any profile" ON public.profiles
  FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Admins can delete any profile" ON public.profiles;
CREATE POLICY "Admins can delete any profile" ON public.profiles
  FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- VENUES
DROP POLICY IF EXISTS "Admins can view all venues" ON public.venues;
CREATE POLICY "Admins can view all venues" ON public.venues
  FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Admins can update any venue" ON public.venues;
CREATE POLICY "Admins can update any venue" ON public.venues
  FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Admins can delete any venue" ON public.venues;
CREATE POLICY "Admins can delete any venue" ON public.venues
  FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- BOOKINGS
DROP POLICY IF EXISTS "Admins can view all bookings" ON public.bookings;
CREATE POLICY "Admins can view all bookings" ON public.bookings
  FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Admins can update any booking" ON public.bookings;
CREATE POLICY "Admins can update any booking" ON public.bookings
  FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- REVIEWS
DROP POLICY IF EXISTS "Admins can update any review" ON public.reviews;
CREATE POLICY "Admins can update any review" ON public.reviews
  FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Admins can delete any review" ON public.reviews;
CREATE POLICY "Admins can delete any review" ON public.reviews
  FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'));
