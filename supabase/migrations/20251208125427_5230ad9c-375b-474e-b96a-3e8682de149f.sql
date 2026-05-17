-- Create jobs table for job listings
CREATE TABLE public.jobs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  category TEXT NOT NULL,
  country TEXT NOT NULL,
  description TEXT NOT NULL,
  salary TEXT,
  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'closed')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create applicants table for job applications
CREATE TABLE public.applicants (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  job_id UUID REFERENCES public.jobs(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT NOT NULL,
  cv_url TEXT NOT NULL,
  uploaded_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create queries table for general inquiries with optional CV
CREATE TABLE public.queries (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT NOT NULL,
  message TEXT NOT NULL,
  cv_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security on all tables
ALTER TABLE public.jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.applicants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.queries ENABLE ROW LEVEL SECURITY;

-- Jobs table: Allow public read access for open jobs
CREATE POLICY "Anyone can view open jobs"
ON public.jobs
FOR SELECT
USING (status = 'open');

-- Applicants table: Allow public insert for job applications
CREATE POLICY "Anyone can submit job applications"
ON public.applicants
FOR INSERT
WITH CHECK (true);

-- Queries table: Allow public insert for general queries
CREATE POLICY "Anyone can submit queries"
ON public.queries
FOR INSERT
WITH CHECK (true);

-- Create storage bucket for CVs
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('cvs', 'cvs', true, 5242880, ARRAY['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document']);

-- Storage policies for CV uploads
CREATE POLICY "Anyone can upload CVs"
ON storage.objects
FOR INSERT
WITH CHECK (bucket_id = 'cvs');

CREATE POLICY "Anyone can view CVs"
ON storage.objects
FOR SELECT
USING (bucket_id = 'cvs');