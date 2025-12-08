-- Create a unique index on analysis_results to prevent duplicate profiles per user
CREATE UNIQUE INDEX idx_unique_profile_per_user 
ON public.analysis_results (
  user_id, 
  (analysis_data->>'profile'), 
  (analysis_data->>'country'), 
  (analysis_data->>'language')
);