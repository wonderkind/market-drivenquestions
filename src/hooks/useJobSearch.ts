import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Job, SearchParams, SearchResponse } from '@/types/job';
import { useToast } from '@/hooks/use-toast';

export function useJobSearch() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchParams, setSearchParams] = useState<SearchParams | null>(null);
  const { toast } = useToast();

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

  return {
    jobs,
    loading,
    searchParams,
    searchJobs,
    setJobs,
  };
}
