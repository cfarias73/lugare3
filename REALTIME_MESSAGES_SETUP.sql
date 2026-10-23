-- Script para asegurar que la tabla messages tenga habilitado Realtime en Supabase
-- Ejecutar en el SQL Editor de Supabase si los eventos en tiempo real no se emiten.

-- 1. Habilitar Replica Identity Full para enviar el registro completo en los eventos
ALTER TABLE public.messages REPLICA IDENTITY FULL;

-- 2. Agregar la tabla messages a la publicación supabase_realtime
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' 
      AND schemaname = 'public' 
      AND tablename = 'messages'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;
  END IF;
END $$;

-- 3. Asegurar que las políticas RLS permitan SELECT a los participantes de la conversación
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'messages' 
      AND policyname = 'messages_select_policy'
  ) THEN
    CREATE POLICY messages_select_policy ON public.messages
      FOR SELECT
      USING (
        auth.uid() = sender_id OR
        EXISTS (
          SELECT 1 FROM public.conversations c
          WHERE c.id = messages.conversation_id
            AND (c.user_id = auth.uid() OR c.provider_id = auth.uid())
        )
      );
  END IF;
END $$;
