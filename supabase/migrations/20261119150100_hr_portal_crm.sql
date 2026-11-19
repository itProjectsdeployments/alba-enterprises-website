-- HR portal: staff access (admin + hr), candidate CRM tables, and a guard that
-- stops users from changing their own role/approval on the profiles table.

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

-- 2. Staff can manage vacancies and work with website applications/enquiries.
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

-- 4. Candidate CRM.
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

CREATE INDEX IF NOT EXISTS crm_candidates_status_idx ON public.crm_candidates (status);
CREATE INDEX IF NOT EXISTS crm_candidates_phone_idx ON public.crm_candidates (phone);
CREATE INDEX IF NOT EXISTS crm_candidates_follow_up_idx ON public.crm_candidates (next_follow_up);
CREATE INDEX IF NOT EXISTS crm_candidates_created_idx ON public.crm_candidates (created_at DESC);

CREATE TABLE IF NOT EXISTS public.crm_activities (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  candidate_id uuid NOT NULL REFERENCES public.crm_candidates(id) ON DELETE CASCADE,
  kind text NOT NULL DEFAULT 'note',
  content text NOT NULL,
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_by_email text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS crm_activities_candidate_idx ON public.crm_activities (candidate_id, created_at DESC);

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

DROP TRIGGER IF EXISTS crm_candidates_touch ON public.crm_candidates;
CREATE TRIGGER crm_candidates_touch
  BEFORE UPDATE ON public.crm_candidates
  FOR EACH ROW EXECUTE FUNCTION public.crm_touch_updated_at();

ALTER TABLE public.crm_candidates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.crm_activities ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Staff manage crm candidates" ON public.crm_candidates;
CREATE POLICY "Staff manage crm candidates" ON public.crm_candidates
  FOR ALL TO authenticated
  USING (public.is_staff(auth.uid()))
  WITH CHECK (public.is_staff(auth.uid()));

DROP POLICY IF EXISTS "Staff manage crm activities" ON public.crm_activities;
CREATE POLICY "Staff manage crm activities" ON public.crm_activities
  FOR ALL TO authenticated
  USING (public.is_staff(auth.uid()))
  WITH CHECK (public.is_staff(auth.uid()));
