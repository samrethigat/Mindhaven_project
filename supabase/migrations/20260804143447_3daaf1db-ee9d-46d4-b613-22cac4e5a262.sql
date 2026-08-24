
ALTER TABLE public.appointments
  ADD COLUMN IF NOT EXISTS purpose text,
  ADD COLUMN IF NOT EXISTS notes text,
  ADD COLUMN IF NOT EXISTS reschedule_requested_at timestamptz,
  ADD COLUMN IF NOT EXISTS reschedule_note text;

DROP POLICY IF EXISTS "appt counsellor create" ON public.appointments;
CREATE POLICY "appt counsellor create" ON public.appointments
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = counsellor_user_id AND public.has_role(auth.uid(), 'counsellor'));

ALTER TABLE public.emergency_alerts
  ADD COLUMN IF NOT EXISTS reason text,
  ADD COLUMN IF NOT EXISTS mental_status text,
  ADD COLUMN IF NOT EXISTS ai_score integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS resolved_at timestamptz,
  ADD COLUMN IF NOT EXISTS resolved_by uuid;

DROP POLICY IF EXISTS "alert counsellor read" ON public.emergency_alerts;
CREATE POLICY "alert counsellor read" ON public.emergency_alerts
  FOR SELECT TO authenticated
  USING (
    auth.uid() = counsellor_user_id
    OR public.has_role(auth.uid(), 'admin')
    OR (counsellor_user_id IS NULL AND public.has_role(auth.uid(), 'counsellor'))
  );

DROP POLICY IF EXISTS "alert counsellor update" ON public.emergency_alerts;
CREATE POLICY "alert counsellor update" ON public.emergency_alerts
  FOR UPDATE TO authenticated
  USING (auth.uid() = counsellor_user_id OR (counsellor_user_id IS NULL AND public.has_role(auth.uid(), 'counsellor')))
  WITH CHECK (public.has_role(auth.uid(), 'counsellor'));

ALTER TABLE public.students
  ADD COLUMN IF NOT EXISTS last_active_at timestamptz NOT NULL DEFAULT now();

CREATE OR REPLACE FUNCTION public.is_emergency_contact_of(_counsellor uuid, _student uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.emergency_alerts e
    WHERE e.student_user_id = _student
      AND e.resolved = false
      AND (e.counsellor_user_id = _counsellor OR e.counsellor_user_id IS NULL)
      AND public.has_role(_counsellor, 'counsellor')
  )
$$;
REVOKE ALL ON FUNCTION public.is_emergency_contact_of(uuid, uuid) FROM public, anon;
GRANT EXECUTE ON FUNCTION public.is_emergency_contact_of(uuid, uuid) TO authenticated;

DROP POLICY IF EXISTS "counsellor reads emergency student profile" ON public.students;
CREATE POLICY "counsellor reads emergency student profile" ON public.students
  FOR SELECT TO authenticated
  USING (public.is_emergency_contact_of(auth.uid(), user_id));

CREATE TABLE IF NOT EXISTS public.messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sender_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  recipient_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  content text NOT NULL DEFAULT '',
  kind text NOT NULL DEFAULT 'text',
  attachment_path text,
  attachment_name text,
  attachment_type text,
  read_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE ON public.messages TO authenticated;
GRANT ALL ON public.messages TO service_role;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "messages participants read" ON public.messages
  FOR SELECT TO authenticated
  USING (auth.uid() = sender_id OR auth.uid() = recipient_id);
CREATE POLICY "messages send" ON public.messages
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = sender_id);
CREATE POLICY "messages recipient marks read" ON public.messages
  FOR UPDATE TO authenticated
  USING (auth.uid() = recipient_id)
  WITH CHECK (auth.uid() = recipient_id);

CREATE INDEX IF NOT EXISTS messages_pair_idx ON public.messages (sender_id, recipient_id, created_at DESC);
ALTER TABLE public.messages REPLICA IDENTITY FULL;

DROP POLICY IF EXISTS "chat files upload own" ON storage.objects;
CREATE POLICY "chat files upload own" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'chat-files' AND (storage.foldername(name))[1] = auth.uid()::text);

DROP POLICY IF EXISTS "chat files read participants" ON storage.objects;
CREATE POLICY "chat files read participants" ON storage.objects
  FOR SELECT TO authenticated
  USING (
    bucket_id = 'chat-files' AND EXISTS (
      SELECT 1 FROM public.messages m
      WHERE m.attachment_path = storage.objects.name
        AND (m.sender_id = auth.uid() OR m.recipient_id = auth.uid())
    )
  );
