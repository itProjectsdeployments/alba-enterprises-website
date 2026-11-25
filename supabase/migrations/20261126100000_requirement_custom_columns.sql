-- Per-requirement columns in the candidates table.
-- crm_jobs.custom_columns: ordered list of extra columns HR added to that requirement's table.
--   "field:<name>" pins a standard candidate field (e.g. "field:city"); anything else is a custom column.
-- crm_applications.custom: the values of the custom columns for that candidate on that requirement.
ALTER TABLE public.crm_jobs ADD COLUMN IF NOT EXISTS custom_columns jsonb NOT NULL DEFAULT '[]'::jsonb;
ALTER TABLE public.crm_applications ADD COLUMN IF NOT EXISTS custom jsonb NOT NULL DEFAULT '{}'::jsonb;
