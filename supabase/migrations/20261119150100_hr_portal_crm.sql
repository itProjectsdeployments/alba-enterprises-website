-- HR recruitment CRM: staff access (admin + hr), CRM tables covering the full
-- 7-step recruitment process, a private bucket for candidate documents, and a
-- guard that stops users from changing their own role/approval on profiles.

-- 1. Staff helper. Compares as text so it works even in the same transaction
--    that added the 'hr' enum value.
CREATE OR REPLACE FUNCTION public.is_staff(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role::text IN ('admin', 'hr')
  );
$$;

-- 2. Staff can manage website vacancies and work with website applications/enquiries.
DROP POLICY IF EXISTS "Staff manage jobs" ON public.jobs;
CREATE POLICY "Staff manage jobs" ON public.jobs
  FOR ALL TO authenticated
  USING (public.is_staff(auth.uid()))
  WITH CHECK (public.is_staff(auth.uid()));

DROP POLICY IF EXISTS "Staff view applicants" ON public.applicants;
CREATE POLICY "Staff view applicants" ON public.applicants
  FOR SELECT TO authenticated USING (public.is_staff(auth.uid()));

DROP POLICY IF EXISTS "Staff update applicants" ON public.applicants;
CREATE POLICY "Staff update applicants" ON public.applicants
  FOR UPDATE TO authenticated
  USING (public.is_staff(auth.uid()))
  WITH CHECK (public.is_staff(auth.uid()));

DROP POLICY IF EXISTS "Staff delete applicants" ON public.applicants;
CREATE POLICY "Staff delete applicants" ON public.applicants
  FOR DELETE TO authenticated USING (public.is_staff(auth.uid()));

DROP POLICY IF EXISTS "Staff view queries" ON public.queries;
CREATE POLICY "Staff view queries" ON public.queries
  FOR SELECT TO authenticated USING (public.is_staff(auth.uid()));

DROP POLICY IF EXISTS "Staff delete queries" ON public.queries;
CREATE POLICY "Staff delete queries" ON public.queries
  FOR DELETE TO authenticated USING (public.is_staff(auth.uid()));

-- 3. Profiles: users may edit their name/phone, but never their own role or
--    approval. Admins and server-side code (no auth.uid()) are unaffected.
CREATE OR REPLACE FUNCTION public.protect_profile_privileges()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF auth.uid() IS NULL OR public.has_role(auth.uid(), 'admin') THEN
    RETURN NEW;
  END IF;
  IF TG_OP = 'INSERT' THEN
    IF NEW.role IS DISTINCT FROM 'recruiter' THEN
      NEW.role := 'worker';
    END IF;
    NEW.approved := false;
  ELSE
    NEW.role := OLD.role;
    NEW.approved := OLD.approved;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS protect_profile_privileges ON public.profiles;
CREATE TRIGGER protect_profile_privileges
  BEFORE INSERT OR UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.protect_profile_privileges();

-- 4. CRM tables -------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.crm_touch_updated_at()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.updated_at := now();
  RETURN NEW;
END;
$$;

-- Clients: hotels / hospitality businesses we recruit for.
CREATE TABLE IF NOT EXISTS public.crm_clients (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  property_type text,
  city text,
  address text,
  contact_person text,
  contact_designation text,
  contact_phone text,
  contact_email text,
  terms text,
  status text NOT NULL DEFAULT 'Active',
  notes text,
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Requirements (Step 1): positions a client needs filled.
CREATE TABLE IF NOT EXISTS public.crm_jobs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id uuid REFERENCES public.crm_clients(id) ON DELETE SET NULL,
  title text NOT NULL,
  department text,
  level text,
  openings integer NOT NULL DEFAULT 1 CHECK (openings > 0),
  location text,
  salary_range text,
  experience_required text,
  shift text,
  benefits text,
  skills text,
  description text,
  target_date date,
  priority text NOT NULL DEFAULT 'Normal',
  status text NOT NULL DEFAULT 'Open',
  public_job_id uuid REFERENCES public.jobs(id) ON DELETE SET NULL,
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Candidates (Step 2): the talent database.
CREATE TABLE IF NOT EXISTS public.crm_candidates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  full_name text NOT NULL,
  phone text,
  email text,
  city text,
  job_role text,
  department text,
  experience text,
  current_employer text,
  current_salary text,
  expected_salary text,
  notice_period text,
  source text NOT NULL DEFAULT 'Other',
  status text NOT NULL DEFAULT 'New',
  next_follow_up date,
  interview_at timestamptz,
  notes text,
  cv_url text,
  tags text[] NOT NULL DEFAULT '{}',
  extra jsonb NOT NULL DEFAULT '{}'::jsonb,
  source_ref text UNIQUE,
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Applications: one candidate on one requirement, moving through Steps 2-6.
CREATE TABLE IF NOT EXISTS public.crm_applications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id uuid NOT NULL REFERENCES public.crm_jobs(id) ON DELETE CASCADE,
  candidate_id uuid NOT NULL REFERENCES public.crm_candidates(id) ON DELETE CASCADE,
  stage text NOT NULL DEFAULT 'Sourced',
  score_skill smallint CHECK (score_skill BETWEEN 1 AND 5),
  score_experience smallint CHECK (score_experience BETWEEN 1 AND 5),
  score_communication smallint CHECK (score_communication BETWEEN 1 AND 5),
  score_grooming smallint CHECK (score_grooming BETWEEN 1 AND 5),
  screening_notes text,
  cv_sent_at timestamptz,
  offer_salary text,
  offer_date date,
  offer_status text,
  joining_date date,
  joined_on date,
  rejection_reason text,
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (job_id, candidate_id)
);

-- Interviews & trials (Step 4).
CREATE TABLE IF NOT EXISTS public.crm_interviews (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  application_id uuid NOT NULL REFERENCES public.crm_applications(id) ON DELETE CASCADE,
  kind text NOT NULL DEFAULT 'Client Interview',
  mode text NOT NULL DEFAULT 'In-person',
  scheduled_at timestamptz NOT NULL,
  location text,
  interviewer text,
  status text NOT NULL DEFAULT 'Scheduled',
  result text NOT NULL DEFAULT 'Pending',
  feedback text,
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Document verification (Step 5).
CREATE TABLE IF NOT EXISTS public.crm_documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  candidate_id uuid NOT NULL REFERENCES public.crm_candidates(id) ON DELETE CASCADE,
  doc_type text NOT NULL,
  status text NOT NULL DEFAULT 'Pending',
  file_path text,
  notes text,
  verified_at timestamptz,
  verified_by_email text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Post-joining follow-up & support (Step 7).
CREATE TABLE IF NOT EXISTS public.crm_followups (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  application_id uuid NOT NULL REFERENCES public.crm_applications(id) ON DELETE CASCADE,
  title text NOT NULL,
  due_date date NOT NULL,
  status text NOT NULL DEFAULT 'Pending',
  candidate_feedback text,
  client_feedback text,
  satisfaction smallint CHECK (satisfaction BETWEEN 1 AND 5),
  notes text,
  done_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- HR to-do list.
CREATE TABLE IF NOT EXISTS public.crm_tasks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  due_date date,
  priority text NOT NULL DEFAULT 'Normal',
  done boolean NOT NULL DEFAULT false,
  candidate_id uuid REFERENCES public.crm_candidates(id) ON DELETE SET NULL,
  job_id uuid REFERENCES public.crm_jobs(id) ON DELETE SET NULL,
  client_id uuid REFERENCES public.crm_clients(id) ON DELETE SET NULL,
  notes text,
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Activity timeline across everything.
CREATE TABLE IF NOT EXISTS public.crm_activities (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  candidate_id uuid REFERENCES public.crm_candidates(id) ON DELETE CASCADE,
  job_id uuid REFERENCES public.crm_jobs(id) ON DELETE CASCADE,
  client_id uuid REFERENCES public.crm_clients(id) ON DELETE CASCADE,
  application_id uuid REFERENCES public.crm_applications(id) ON DELETE CASCADE,
  kind text NOT NULL DEFAULT 'note',
  content text NOT NULL,
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_by_email text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS crm_jobs_client_idx ON public.crm_jobs (client_id);
CREATE INDEX IF NOT EXISTS crm_jobs_status_idx ON public.crm_jobs (status);
CREATE INDEX IF NOT EXISTS crm_candidates_status_idx ON public.crm_candidates (status);
CREATE INDEX IF NOT EXISTS crm_candidates_phone_idx ON public.crm_candidates (phone);
CREATE INDEX IF NOT EXISTS crm_candidates_created_idx ON public.crm_candidates (created_at DESC);
CREATE INDEX IF NOT EXISTS crm_applications_job_idx ON public.crm_applications (job_id);
CREATE INDEX IF NOT EXISTS crm_applications_candidate_idx ON public.crm_applications (candidate_id);
CREATE INDEX IF NOT EXISTS crm_interviews_app_idx ON public.crm_interviews (application_id);
CREATE INDEX IF NOT EXISTS crm_interviews_when_idx ON public.crm_interviews (scheduled_at);
CREATE INDEX IF NOT EXISTS crm_documents_candidate_idx ON public.crm_documents (candidate_id);
CREATE INDEX IF NOT EXISTS crm_followups_app_idx ON public.crm_followups (application_id);
CREATE INDEX IF NOT EXISTS crm_followups_due_idx ON public.crm_followups (due_date);
CREATE INDEX IF NOT EXISTS crm_activities_candidate_idx ON public.crm_activities (candidate_id, created_at DESC);
CREATE INDEX IF NOT EXISTS crm_activities_job_idx ON public.crm_activities (job_id, created_at DESC);

-- updated_at triggers + RLS (staff only) for every CRM table.
DO $$
DECLARE
  t text;
BEGIN
  FOREACH t IN ARRAY ARRAY['crm_clients','crm_jobs','crm_candidates','crm_applications','crm_interviews','crm_documents','crm_followups','crm_tasks','crm_activities']
  LOOP
    EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', t);
    EXECUTE format('DROP POLICY IF EXISTS "Staff manage %s" ON public.%I', t, t);
    EXECUTE format('CREATE POLICY "Staff manage %s" ON public.%I FOR ALL TO authenticated USING (public.is_staff(auth.uid())) WITH CHECK (public.is_staff(auth.uid()))', t, t);
    IF t <> 'crm_activities' THEN
      EXECUTE format('DROP TRIGGER IF EXISTS %I ON public.%I', t || '_touch', t);
      EXECUTE format('CREATE TRIGGER %I BEFORE UPDATE ON public.%I FOR EACH ROW EXECUTE FUNCTION public.crm_touch_updated_at()', t || '_touch', t);
    END IF;
  END LOOP;
END $$;

-- 5. Private storage for candidate documents (ID proofs etc.). Staff only.
INSERT INTO storage.buckets (id, name, public)
VALUES ('crm-docs', 'crm-docs', false)
ON CONFLICT (id) DO UPDATE SET public = false;

DROP POLICY IF EXISTS "Staff read crm docs" ON storage.objects;
CREATE POLICY "Staff read crm docs" ON storage.objects
  FOR SELECT TO authenticated USING (bucket_id = 'crm-docs' AND public.is_staff(auth.uid()));

DROP POLICY IF EXISTS "Staff upload crm docs" ON storage.objects;
CREATE POLICY "Staff upload crm docs" ON storage.objects
  FOR INSERT TO authenticated WITH CHECK (bucket_id = 'crm-docs' AND public.is_staff(auth.uid()));

DROP POLICY IF EXISTS "Staff update crm docs" ON storage.objects;
CREATE POLICY "Staff update crm docs" ON storage.objects
  FOR UPDATE TO authenticated USING (bucket_id = 'crm-docs' AND public.is_staff(auth.uid()));

DROP POLICY IF EXISTS "Staff delete crm docs" ON storage.objects;
CREATE POLICY "Staff delete crm docs" ON storage.objects
  FOR DELETE TO authenticated USING (bucket_id = 'crm-docs' AND public.is_staff(auth.uid()));
