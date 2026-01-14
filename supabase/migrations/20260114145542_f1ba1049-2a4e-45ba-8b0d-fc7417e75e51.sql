-- Drop the restrictive SELECT policy
DROP POLICY IF EXISTS "Users can view own analysis" ON public.analysis_results;

-- Create new policy allowing all authenticated users to view all profiles
CREATE POLICY "Authenticated users can view all analysis"
ON public.analysis_results
FOR SELECT
USING (auth.uid() IS NOT NULL);