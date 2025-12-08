import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Job, SearchParams, SearchResponse, ProfileTranslateParams, ProfileTranslateResponse, EnhancedJob } from '@/types/job';
import { useToast } from '@/hooks/use-toast';

export function useJobSearch() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(false);
  const [translating, setTranslating] = useState(false);
  const [searchParams, setSearchParams] = useState<SearchParams | null>(null);
  const { toast } = useToast();

  const translateProfile = async (params: ProfileTranslateParams): Promise<string[] | null> => {
    setTranslating(true);

    try {
      const { data, error } = await supabase.functions.invoke('translate-profile', {
        body: params,
      });

      if (error) {
        throw error;
      }

      if (data.error) {
        throw new Error(data.error);
      }

      const response = data as ProfileTranslateResponse;
      return response.jobTitles;
    } catch (error) {
      console.error('Translation error:', error);
      toast({
        title: 'Translation Failed',
        description: error instanceof Error ? error.message : 'Failed to translate profile',
        variant: 'destructive',
      });
      return null;
    } finally {
      setTranslating(false);
    }
  };

  const searchJobs = async (params: SearchParams) => {
    setLoading(true);
    setSearchParams(params);

    try {
      const { data, error } = await supabase.functions.invoke('search-jobs', {
        body: params,
      });

      if (error) {
        throw error;
      }

      if (data.error) {
        throw new Error(data.error);
      }

      const response = data as SearchResponse;
      setJobs(response.data || []);
      
      // Auto-save search for logged-in users
      const { data: { user } } = await supabase.auth.getUser();
      if (user && response.data && response.data.length > 0) {
        try {
          await supabase.from('saved_searches').insert({
            user_id: user.id,
            job_title: params.query,
            location: params.location,
            country: params.country,
            language: params.language,
            date_posted: params.date_posted,
          });
          console.log('Search saved automatically');
        } catch (saveError) {
          // Don't fail the search if saving fails
          console.error('Failed to auto-save search:', saveError);
        }
      }
      
      toast({
        title: 'Search Complete',
        description: `Found ${response.data?.length || 0} jobs`,
      });

      return response.data || [];
    } catch (error) {
      console.error('Search error:', error);
      toast({
        title: 'Search Failed',
        description: error instanceof Error ? error.message : 'Failed to search jobs',
        variant: 'destructive',
      });
      return [];
    } finally {
      setLoading(false);
    }
  };

  const getJobDetails = async (jobIds: string[], country: string): Promise<EnhancedJob[]> => {
    try {
      const { data, error } = await supabase.functions.invoke('get-job-details', {
        body: { jobIds, country },
      });

      if (error) {
        throw error;
      }

      if (data.error) {
        throw new Error(data.error);
      }

      return data.jobs || [];
    } catch (error) {
      console.error('Get job details error:', error);
      toast({
        title: 'Failed to fetch job details',
        description: error instanceof Error ? error.message : 'Failed to get enhanced job data',
        variant: 'destructive',
      });
      return [];
    }
  };

  return {
    jobs,
    loading,
    translating,
    searchParams,
    searchJobs,
    translateProfile,
    getJobDetails,
    setJobs,
  };
}
