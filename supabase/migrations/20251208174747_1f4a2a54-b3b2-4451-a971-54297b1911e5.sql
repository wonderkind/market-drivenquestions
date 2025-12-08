-- Add UPDATE RLS policy for analysis_results table
CREATE POLICY "Users can update own analysis" 
ON public.analysis_results
FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);