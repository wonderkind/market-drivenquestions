-- Create table for O*NET-SOC occupations catalog
CREATE TABLE public.onet_occupations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT UNIQUE NOT NULL,
  title TEXT NOT NULL,
  job_zone INTEGER,
  has_data BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS with public read access (occupation list is public data)
ALTER TABLE public.onet_occupations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view occupations" 
ON public.onet_occupations 
FOR SELECT 
USING (true);