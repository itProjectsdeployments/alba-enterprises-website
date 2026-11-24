-- Google Form → CRM automation.
-- A requirement can be linked to a Google Form by name (intake_key), and a
-- secret token (stored in crm_settings, visible to staff only) authorises the
-- Apps Script that forwards new form responses to the form-intake function.

ALTER TABLE public.crm_jobs ADD COLUMN IF NOT EXISTS intake_key text;
CREATE INDEX IF NOT EXISTS crm_jobs_intake_key_idx ON public.crm_jobs (lower(intake_key));

CREATE TABLE IF NOT EXISTS public.crm_settings (
  key text PRIMARY KEY,
  value text NOT NULL,
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.crm_settings ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Staff manage crm settings" ON public.crm_settings;
CREATE POLICY "Staff manage crm settings" ON public.crm_settings
  FOR ALL TO authenticated
  USING (public.is_staff(auth.uid()))
  WITH CHECK (public.is_staff(auth.uid()));

INSERT INTO public.crm_settings (key, value)
VALUES ('form_intake_token', encode(extensions.gen_random_bytes(24), 'hex'))
ON CONFLICT (key) DO NOTHING;
