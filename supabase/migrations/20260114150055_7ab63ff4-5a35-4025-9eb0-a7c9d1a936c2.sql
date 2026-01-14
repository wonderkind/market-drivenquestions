-- Drop existing restrictive policies
DROP POLICY IF EXISTS "Users can insert own analysis" ON public.analysis_results;
DROP POLICY IF EXISTS "Users can update own analysis" ON public.analysis_results;
DROP POLICY IF EXISTS "Users can delete own analysis" ON public.analysis_results;

-- Create new policies allowing all authenticated users to modify any profile
CREATE POLICY "Authenticated users can insert analysis"
ON public.analysis_results
FOR INSERT
WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can update any analysis"
ON public.analysis_results
FOR UPDATE
USING (auth.uid() IS NOT NULL)
WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can delete any analysis"
ON public.analysis_results
FOR DELETE
USING (auth.uid() IS NOT NULL);