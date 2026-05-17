CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  requested_role text := COALESCE(NEW.raw_user_meta_data->>'role', 'worker');
  safe_role public.app_role;
BEGIN
  -- Public signup must never create admin/staff accounts.
  -- Only recruiter and worker(candidate) are allowed from signup metadata.
  safe_role := CASE
    WHEN requested_role = 'recruiter' THEN 'recruiter'::public.app_role
    ELSE 'worker'::public.app_role
  END;

  INSERT INTO public.profiles (id, email, full_name, phone, company_name, role, approved)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    NEW.raw_user_meta_data->>'phone',
    NEW.raw_user_meta_data->>'company_name',
    safe_role::text,
    false
  )
  ON CONFLICT (id) DO NOTHING;

  INSERT INTO public.user_roles (user_id, role)
  SELECT NEW.id, safe_role
  WHERE NOT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = NEW.id
      AND role = safe_role
  );

  RETURN NEW;
END;
$function$;