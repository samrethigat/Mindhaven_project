
ALTER TABLE public.counsellors
  ADD COLUMN IF NOT EXISTS languages text,
  ADD COLUMN IF NOT EXISTS district text,
  ADD COLUMN IF NOT EXISTS address text,
  ADD COLUMN IF NOT EXISTS consultation_fee numeric,
  ADD COLUMN IF NOT EXISTS available_days text,
  ADD COLUMN IF NOT EXISTS available_slots text,
  ADD COLUMN IF NOT EXISTS rating numeric NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS is_deleted boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS notify_email boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS notify_push boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS profile_public boolean NOT NULL DEFAULT true;

CREATE TABLE IF NOT EXISTS public.call_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  caller_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  callee_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  appointment_id uuid REFERENCES public.appointments(id) ON DELETE SET NULL,
  kind text NOT NULL DEFAULT 'phone',
  status text NOT NULL DEFAULT 'started',
  started_at timestamptz NOT NULL DEFAULT now(),
  ended_at timestamptz,
  duration_seconds integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.call_logs TO authenticated;
GRANT ALL ON public.call_logs TO service_role;
ALTER TABLE public.call_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "call participants read" ON public.call_logs FOR SELECT TO authenticated
  USING (auth.uid() = caller_id OR auth.uid() = callee_id OR public.has_role(auth.uid(),'admin'));
CREATE POLICY "call caller insert" ON public.call_logs FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = caller_id);
CREATE POLICY "call caller update" ON public.call_logs FOR UPDATE TO authenticated
  USING (auth.uid() = caller_id) WITH CHECK (auth.uid() = caller_id);

CREATE TABLE IF NOT EXISTS public.account_deletions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  role text NOT NULL,
  full_name text NOT NULL,
  email text NOT NULL,
  reason text,
  deleted_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.account_deletions TO authenticated;
GRANT ALL ON public.account_deletions TO service_role;
ALTER TABLE public.account_deletions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "admins read deletions" ON public.account_deletions FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(),'admin'));
