
-- ROLES
CREATE TYPE public.app_role AS ENUM ('student','counsellor','admin');
CREATE TYPE public.risk_level AS ENUM ('level_1','level_2','level_3');
CREATE TYPE public.appointment_status AS ENUM ('pending','accepted','rejected','completed','cancelled');

CREATE TABLE public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.app_role NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);
GRANT SELECT ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role public.app_role)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role)
$$;

CREATE POLICY "read own roles" ON public.user_roles FOR SELECT TO authenticated USING (auth.uid() = user_id OR public.has_role(auth.uid(),'admin'));

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER LANGUAGE plpgsql SET search_path = public AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END; $$;

-- STUDENTS
CREATE TABLE public.students (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name text NOT NULL,
  dob date,
  age int CHECK (age IS NULL OR (age BETWEEN 10 AND 100)),
  gender text,
  college text,
  department text,
  year_of_study text,
  register_number text,
  email text NOT NULL,
  mobile_number text,
  parent_name text,
  parent_mobile text,
  friend_name text,
  friend_mobile text,
  emergency_contact text,
  blood_group text,
  address text,
  city text,
  state text,
  country text,
  pin_code text,
  avatar_url text,
  perm_location boolean NOT NULL DEFAULT false,
  perm_camera boolean NOT NULL DEFAULT false,
  perm_microphone boolean NOT NULL DEFAULT false,
  perm_notification boolean NOT NULL DEFAULT false,
  perm_storage boolean NOT NULL DEFAULT false,
  last_lat double precision,
  last_lng double precision,
  onboarding_complete boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX students_user_idx ON public.students(user_id);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.students TO authenticated;
GRANT ALL ON public.students TO service_role;
ALTER TABLE public.students ENABLE ROW LEVEL SECURITY;
CREATE POLICY "students own row" ON public.students FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "admins read students" ON public.students FOR SELECT TO authenticated USING (public.has_role(auth.uid(),'admin'));
CREATE TRIGGER students_updated BEFORE UPDATE ON public.students FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- COUNSELLORS
CREATE TABLE public.counsellors (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name text NOT NULL,
  qualification text,
  experience_years int DEFAULT 0,
  hospital text,
  clinic text,
  email text NOT NULL,
  phone text,
  city text,
  state text,
  country text,
  lat double precision,
  lng double precision,
  availability text,
  specialization text,
  license_number text,
  bio text,
  photo_url text,
  is_available boolean NOT NULL DEFAULT true,
  verified boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.counsellors TO authenticated;
GRANT SELECT ON public.counsellors TO anon;
GRANT ALL ON public.counsellors TO service_role;
ALTER TABLE public.counsellors ENABLE ROW LEVEL SECURITY;
CREATE POLICY "counsellor directory public" ON public.counsellors FOR SELECT USING (true);
CREATE POLICY "counsellor own row write" ON public.counsellors FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "counsellor own row update" ON public.counsellors FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "counsellor own row delete" ON public.counsellors FOR DELETE TO authenticated USING (auth.uid() = user_id);
CREATE TRIGGER counsellors_updated BEFORE UPDATE ON public.counsellors FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ASSESSMENTS
CREATE TABLE public.assessments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  answers jsonb NOT NULL DEFAULT '{}'::jsonb,
  scores jsonb NOT NULL DEFAULT '{}'::jsonb,
  total_score int NOT NULL DEFAULT 0,
  wellbeing_score int NOT NULL DEFAULT 0,
  risk public.risk_level NOT NULL DEFAULT 'level_1',
  suicidal_flag boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX assessments_user_idx ON public.assessments(user_id, created_at DESC);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.assessments TO authenticated;
GRANT ALL ON public.assessments TO service_role;
ALTER TABLE public.assessments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "assessment own" ON public.assessments FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "assessment admin read" ON public.assessments FOR SELECT TO authenticated USING (public.has_role(auth.uid(),'admin'));

-- MOOD / JOURNAL / SLEEP / CHECKIN
CREATE TABLE public.mood_entries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  mood text NOT NULL,
  mood_score int NOT NULL CHECK (mood_score BETWEEN 1 AND 10),
  note text,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX mood_user_idx ON public.mood_entries(user_id, created_at DESC);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.mood_entries TO authenticated;
GRANT ALL ON public.mood_entries TO service_role;
ALTER TABLE public.mood_entries ENABLE ROW LEVEL SECURITY;
CREATE POLICY "mood own" ON public.mood_entries FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE TABLE public.journal_entries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title text,
  content text NOT NULL,
  sentiment text,
  sentiment_score numeric,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX journal_user_idx ON public.journal_entries(user_id, created_at DESC);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.journal_entries TO authenticated;
GRANT ALL ON public.journal_entries TO service_role;
ALTER TABLE public.journal_entries ENABLE ROW LEVEL SECURITY;
CREATE POLICY "journal own" ON public.journal_entries FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE TRIGGER journal_updated BEFORE UPDATE ON public.journal_entries FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE public.sleep_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  log_date date NOT NULL DEFAULT current_date,
  hours numeric NOT NULL CHECK (hours >= 0 AND hours <= 24),
  quality int CHECK (quality BETWEEN 1 AND 5),
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, log_date)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.sleep_logs TO authenticated;
GRANT ALL ON public.sleep_logs TO service_role;
ALTER TABLE public.sleep_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "sleep own" ON public.sleep_logs FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE TABLE public.checkins (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  checkin_date date NOT NULL DEFAULT current_date,
  stress_level int CHECK (stress_level BETWEEN 1 AND 10),
  energy_level int CHECK (energy_level BETWEEN 1 AND 10),
  social_level int CHECK (social_level BETWEEN 1 AND 10),
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, checkin_date)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.checkins TO authenticated;
GRANT ALL ON public.checkins TO service_role;
ALTER TABLE public.checkins ENABLE ROW LEVEL SECURITY;
CREATE POLICY "checkin own" ON public.checkins FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- AI CHAT
CREATE TABLE public.chat_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role text NOT NULL CHECK (role IN ('user','assistant')),
  content text NOT NULL,
  emotion text,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX chat_user_idx ON public.chat_messages(user_id, created_at);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.chat_messages TO authenticated;
GRANT ALL ON public.chat_messages TO service_role;
ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "chat own" ON public.chat_messages FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- EMOTION ANALYSES
CREATE TABLE public.emotion_analyses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  source text NOT NULL CHECK (source IN ('chat','voice','face','typing','questionnaire','combined')),
  emotion text NOT NULL,
  confidence numeric,
  distress_score int NOT NULL DEFAULT 0,
  risk public.risk_level NOT NULL DEFAULT 'level_1',
  details jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX emotion_user_idx ON public.emotion_analyses(user_id, created_at DESC);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.emotion_analyses TO authenticated;
GRANT ALL ON public.emotion_analyses TO service_role;
ALTER TABLE public.emotion_analyses ENABLE ROW LEVEL SECURITY;
CREATE POLICY "emotion own" ON public.emotion_analyses FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "emotion admin read" ON public.emotion_analyses FOR SELECT TO authenticated USING (public.has_role(auth.uid(),'admin'));

-- APPOINTMENTS
CREATE TABLE public.appointments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  counsellor_user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  scheduled_at timestamptz NOT NULL,
  mode text NOT NULL DEFAULT 'video' CHECK (mode IN ('video','voice','chat','in_person')),
  status public.appointment_status NOT NULL DEFAULT 'pending',
  reason text,
  is_emergency boolean NOT NULL DEFAULT false,
  room_id text NOT NULL DEFAULT gen_random_uuid()::text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX appt_student_idx ON public.appointments(student_user_id, scheduled_at DESC);
CREATE INDEX appt_counsellor_idx ON public.appointments(counsellor_user_id, scheduled_at DESC);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.appointments TO authenticated;
GRANT ALL ON public.appointments TO service_role;
ALTER TABLE public.appointments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "appt participants read" ON public.appointments FOR SELECT TO authenticated USING (auth.uid() = student_user_id OR auth.uid() = counsellor_user_id OR public.has_role(auth.uid(),'admin'));
CREATE POLICY "appt student create" ON public.appointments FOR INSERT TO authenticated WITH CHECK (auth.uid() = student_user_id);
CREATE POLICY "appt participants update" ON public.appointments FOR UPDATE TO authenticated USING (auth.uid() = student_user_id OR auth.uid() = counsellor_user_id) WITH CHECK (auth.uid() = student_user_id OR auth.uid() = counsellor_user_id);
CREATE TRIGGER appt_updated BEFORE UPDATE ON public.appointments FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE OR REPLACE FUNCTION public.is_my_patient(_counsellor uuid, _student uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.appointments a WHERE a.counsellor_user_id = _counsellor AND a.student_user_id = _student)
$$;

CREATE POLICY "counsellor reads patient profile" ON public.students FOR SELECT TO authenticated USING (public.is_my_patient(auth.uid(), user_id));
CREATE POLICY "counsellor reads patient assessments" ON public.assessments FOR SELECT TO authenticated USING (public.is_my_patient(auth.uid(), user_id));
CREATE POLICY "counsellor reads patient emotions" ON public.emotion_analyses FOR SELECT TO authenticated USING (public.is_my_patient(auth.uid(), user_id));

-- SESSION NOTES
CREATE TABLE public.session_notes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  appointment_id uuid REFERENCES public.appointments(id) ON DELETE CASCADE,
  counsellor_user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  student_user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  notes text NOT NULL,
  prescription text,
  progress_rating int CHECK (progress_rating BETWEEN 1 AND 10),
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.session_notes TO authenticated;
GRANT ALL ON public.session_notes TO service_role;
ALTER TABLE public.session_notes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "notes counsellor manage" ON public.session_notes FOR ALL TO authenticated USING (auth.uid() = counsellor_user_id) WITH CHECK (auth.uid() = counsellor_user_id);
CREATE POLICY "notes student read" ON public.session_notes FOR SELECT TO authenticated USING (auth.uid() = student_user_id);

-- NOTIFICATIONS
CREATE TABLE public.notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title text NOT NULL,
  body text NOT NULL,
  kind text NOT NULL DEFAULT 'info',
  read boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX notif_user_idx ON public.notifications(user_id, created_at DESC);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.notifications TO authenticated;
GRANT ALL ON public.notifications TO service_role;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
CREATE POLICY "notif own" ON public.notifications FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- EMERGENCY ALERTS
CREATE TABLE public.emergency_alerts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  counsellor_user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  risk public.risk_level NOT NULL DEFAULT 'level_3',
  trigger_source text NOT NULL DEFAULT 'combined',
  summary text NOT NULL,
  report jsonb NOT NULL DEFAULT '{}'::jsonb,
  lat double precision,
  lng double precision,
  contacts_notified jsonb NOT NULL DEFAULT '[]'::jsonb,
  resolved boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX alert_student_idx ON public.emergency_alerts(student_user_id, created_at DESC);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.emergency_alerts TO authenticated;
GRANT ALL ON public.emergency_alerts TO service_role;
ALTER TABLE public.emergency_alerts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "alert student own" ON public.emergency_alerts FOR ALL TO authenticated USING (auth.uid() = student_user_id) WITH CHECK (auth.uid() = student_user_id);
CREATE POLICY "alert counsellor read" ON public.emergency_alerts FOR SELECT TO authenticated USING (auth.uid() = counsellor_user_id OR public.has_role(auth.uid(),'admin'));
CREATE POLICY "alert counsellor update" ON public.emergency_alerts FOR UPDATE TO authenticated USING (auth.uid() = counsellor_user_id) WITH CHECK (auth.uid() = counsellor_user_id);

-- SIGNUP TRIGGER: create role + base profile from metadata
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE r text;
BEGIN
  r := COALESCE(NEW.raw_user_meta_data->>'role','student');
  IF r NOT IN ('student','counsellor') THEN r := 'student'; END IF;
  INSERT INTO public.user_roles(user_id, role) VALUES (NEW.id, r::public.app_role) ON CONFLICT DO NOTHING;
  IF r = 'student' THEN
    INSERT INTO public.students(user_id, full_name, email)
    VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'full_name','Student'), NEW.email)
    ON CONFLICT (user_id) DO NOTHING;
  ELSE
    INSERT INTO public.counsellors(user_id, full_name, email)
    VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'full_name','Counsellor'), NEW.email)
    ON CONFLICT (user_id) DO NOTHING;
  END IF;
  RETURN NEW;
END; $$;

CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;
ALTER PUBLICATION supabase_realtime ADD TABLE public.emergency_alerts;
ALTER PUBLICATION supabase_realtime ADD TABLE public.appointments;
