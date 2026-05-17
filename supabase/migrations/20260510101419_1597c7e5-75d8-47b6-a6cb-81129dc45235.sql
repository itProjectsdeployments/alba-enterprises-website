
ALTER TABLE public.applicants ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'new';

CREATE POLICY "Admins can update applicants"
ON public.applicants
FOR UPDATE
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));
