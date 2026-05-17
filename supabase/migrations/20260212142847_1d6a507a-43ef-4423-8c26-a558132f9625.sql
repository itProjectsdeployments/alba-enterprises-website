
-- Add new roles to enum
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'recruiter';
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'worker';

-- Create profiles table
CREATE TABLE public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    full_name TEXT,
    email TEXT,
    phone TEXT,
    role TEXT CHECK (role IN ('admin', 'recruiter', 'worker')),
    company_name TEXT,
    approved BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Profiles RLS
CREATE POLICY "Users can read own profile"
ON public.profiles FOR SELECT TO authenticated
USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
ON public.profiles FOR UPDATE TO authenticated
USING (auth.uid() = id);

CREATE POLICY "Admin can read all profiles"
ON public.profiles FOR SELECT TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Anyone can insert own profile"
ON public.profiles FOR INSERT TO authenticated
WITH CHECK (auth.uid() = id);

-- Create recruiter_requirements table
CREATE TABLE public.recruiter_requirements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    recruiter_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    job_title TEXT NOT NULL,
    skill_required TEXT,
    location TEXT,
    salary_range TEXT,
    number_required INTEGER,
    status TEXT DEFAULT 'pending',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

ALTER TABLE public.recruiter_requirements ENABLE ROW LEVEL SECURITY;

-- recruiter_requirements RLS
CREATE POLICY "Recruiter can insert own requirements"
ON public.recruiter_requirements FOR INSERT TO authenticated
WITH CHECK (auth.uid() = recruiter_id);

CREATE POLICY "Recruiter can read own requirements"
ON public.recruiter_requirements FOR SELECT TO authenticated
USING (auth.uid() = recruiter_id);

CREATE POLICY "Admin can read all requirements"
ON public.recruiter_requirements FOR SELECT TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admin can update all requirements"
ON public.recruiter_requirements FOR UPDATE TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Add new columns to existing jobs table
ALTER TABLE public.jobs ADD COLUMN IF NOT EXISTS location TEXT;
ALTER TABLE public.jobs ADD COLUMN IF NOT EXISTS recruiter_id UUID REFERENCES public.profiles(id);
ALTER TABLE public.jobs ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES public.profiles(id);
ALTER TABLE public.jobs ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;

-- Create applications table
CREATE TABLE public.applications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    job_id UUID REFERENCES public.jobs(id) ON DELETE CASCADE NOT NULL,
    worker_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    resume_url TEXT,
    status TEXT DEFAULT 'pending',
    applied_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

ALTER TABLE public.applications ENABLE ROW LEVEL SECURITY;

-- Applications RLS
CREATE POLICY "Worker can insert own application"
ON public.applications FOR INSERT TO authenticated
WITH CHECK (auth.uid() = worker_id);

CREATE POLICY "Worker can read own applications"
ON public.applications FOR SELECT TO authenticated
USING (auth.uid() = worker_id);

CREATE POLICY "Admin can read all applications"
ON public.applications FOR SELECT TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Recruiter can read applications for their jobs"
ON public.applications FOR SELECT TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.jobs
        WHERE jobs.id = applications.job_id
        AND jobs.recruiter_id = auth.uid()
    )
);

-- Admin full access on applications
CREATE POLICY "Admin can update all applications"
ON public.applications FOR UPDATE TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admin can delete all applications"
ON public.applications FOR DELETE TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Create resumes storage bucket (private)
INSERT INTO storage.buckets (id, name, public) VALUES ('resumes', 'resumes', false);

-- Storage policies for resumes
CREATE POLICY "Workers can upload resumes"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'resumes' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Workers can view own resumes"
ON storage.objects FOR SELECT TO authenticated
USING (bucket_id = 'resumes' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Admin can view all resumes"
ON storage.objects FOR SELECT TO authenticated
USING (bucket_id = 'resumes' AND public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Recruiter can view resumes for their jobs"
ON storage.objects FOR SELECT TO authenticated
USING (
    bucket_id = 'resumes' AND EXISTS (
        SELECT 1 FROM public.applications a
        JOIN public.jobs j ON j.id = a.job_id
        WHERE j.recruiter_id = auth.uid()
        AND a.resume_url LIKE '%' || storage.filename(name)
    )
);

-- Trigger function to auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    INSERT INTO public.profiles (id, email, full_name, role, approved)
    VALUES (
        NEW.id,
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
        COALESCE(NEW.raw_user_meta_data->>'role', 'worker'),
        CASE WHEN COALESCE(NEW.raw_user_meta_data->>'role', 'worker') = 'admin' THEN false ELSE false END
    );

    -- Also insert into user_roles for RLS checks
    INSERT INTO public.user_roles (user_id, role)
    VALUES (NEW.id, (COALESCE(NEW.raw_user_meta_data->>'role', 'worker'))::app_role);

    RETURN NEW;
END;
$$;

-- Create trigger on auth.users
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
