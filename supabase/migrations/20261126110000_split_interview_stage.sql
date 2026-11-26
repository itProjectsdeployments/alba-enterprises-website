-- Step 4 is now our own Internal Interview and Step 5 the Client Interview & Selection.
-- Candidates in the old single "Interview / Trial" stage are placed by the kind of interview they have.
UPDATE public.crm_applications a
SET stage = CASE
  WHEN EXISTS (
    SELECT 1 FROM public.crm_interviews i
    WHERE i.application_id = a.id
      AND i.kind NOT IN ('Internal Screening', 'Telephonic Screening', 'Video Call Screening', 'HR Round')
  ) THEN 'Client Interview'
  ELSE 'Internal Interview'
END
WHERE a.stage = 'Interview / Trial';
