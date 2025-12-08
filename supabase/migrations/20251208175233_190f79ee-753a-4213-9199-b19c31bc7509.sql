-- Create jobs table to store individual job listings
CREATE TABLE public.jobs (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  job_id text UNIQUE NOT NULL,
  job_title text NOT NULL,
  employer_name text,
  employer_logo text,
  employer_website text,
  job_publisher text,
  job_employment_type text,
  job_apply_link text,
  job_description text,
  job_is_remote boolean DEFAULT false,
  job_posted_at text,
  job_location text,
  job_city text,
  job_state text,
  job_country text,
  job_benefits text[],
  job_min_salary numeric,
  job_max_salary numeric,
  job_salary_period text,
  job_highlights jsonb,
  enhanced_data_fetched boolean DEFAULT false,
  search_id uuid REFERENCES public.saved_searches(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);

-- Enable RLS
ALTER TABLE public.jobs ENABLE ROW LEVEL SECURITY;

-- Public read policy (jobs are public data from API)
CREATE POLICY "Anyone can view jobs" ON public.jobs FOR SELECT USING (true);

-- Create updated_at trigger
CREATE TRIGGER handle_jobs_updated_at
  BEFORE UPDATE ON public.jobs
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Create index on job_id for fast lookups
CREATE INDEX idx_jobs_job_id ON public.jobs(job_id);

-- Create index on search_id for linking
CREATE INDEX idx_jobs_search_id ON public.jobs(search_id);