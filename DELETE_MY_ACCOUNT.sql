-- Reemplaza la RPC de eliminación de cuenta. La tabla notifications usa
-- user_id (no recipient_id). Ejecutar en Supabase SQL Editor.
DROP FUNCTION IF EXISTS public.delete_my_account();

CREATE FUNCTION public.delete_my_account()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $function$
DECLARE
  account_id uuid := auth.uid();
BEGIN
  IF account_id IS NULL THEN
    RAISE EXCEPTION USING
      ERRCODE = '28000',
      MESSAGE = 'Debes iniciar sesión para eliminar tu cuenta.';
  END IF;

  DELETE FROM public.notifications
  WHERE user_id = account_id;

  DELETE FROM public.messages AS message
  USING public.conversations AS conversation
  WHERE message.conversation_id = conversation.id
    AND (conversation.user_id = account_id OR conversation.provider_id = account_id);

  DELETE FROM public.conversations
  WHERE user_id = account_id OR provider_id = account_id;

  DELETE FROM public.invitation_guests AS guest
  USING public.invitations AS invitation
  WHERE guest.invitation_id = invitation.id
    AND invitation.user_id = account_id;

  DELETE FROM public.invitations
  WHERE user_id = account_id;

  DELETE FROM public.reviews
  WHERE user_id = account_id;

  DELETE FROM public.payments AS payment
  USING public.bookings AS booking
  WHERE payment.booking_id = booking.id
    AND booking.user_id = account_id;

  DELETE FROM public.bookings
  WHERE user_id = account_id;

  DELETE FROM public.user_roles
  WHERE user_id = account_id;

  DELETE FROM public.profiles
  WHERE id = account_id;

  DELETE FROM auth.users
  WHERE id = account_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION USING
      ERRCODE = 'P0002',
      MESSAGE = 'No se encontró la cuenta autenticada para eliminar.';
  END IF;
END;
$function$;

REVOKE ALL ON FUNCTION public.delete_my_account() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.delete_my_account() TO authenticated;
