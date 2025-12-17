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

  // Helper to delay between API calls to avoid rate limiting
  const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

  const searchJobs = async (params: SearchParams) => {
    setLoading(true);
    setSearchParams(params);

    try {
      // Determine which titles to search - use jobTitles array or fallback to query
      const titlesToSearch = params.jobTitles || (params.query ? [params.query] : []);
      
      if (titlesToSearch.length === 0) {
        throw new Error('No job titles provided for search');
      }

      // Sequential API calls with delay to avoid rate limiting
      const allJobs: Job[] = [];
      const seenJobIds = new Set<string>();

      for (let i = 0; i < titlesToSearch.length; i++) {
        const title = titlesToSearch[i];
        
        // Add delay between requests (skip first one)
        if (i > 0) {
          await delay(500);
        }

        try {
          const { data, error } = await supabase.functions.invoke('search-jobs', {
            body: { 
              query: title, 
              location: params.location,
              country: params.country,
              language: params.language,
              date_posted: params.date_posted,
              num_pages: params.num_pages,
            },
          });

          if (error) {
            console.error(`Search error for "${title}":`, error);
            continue;
          }

          if (data?.data) {
            for (const job of data.data) {
              if (!seenJobIds.has(job.job_id)) {
                seenJobIds.add(job.job_id);
                allJobs.push(job);
              }
            }
          }
          
          console.log(`Searched "${title}": found ${data?.data?.length || 0} jobs, total unique: ${allJobs.length}`);
        } catch (titleError) {
          console.error(`Error searching "${title}":`, titleError);
          // Continue with next title even if one fails
        }
      }

      setJobs(allJobs);
      
      // Auto-save search for logged-in users (prevent duplicates)
      const combinedQuery = titlesToSearch.join(', ');
      const { data: { user } } = await supabase.auth.getUser();
      if (user && allJobs.length > 0) {
        try {
          // Check if this exact search already exists
          const { data: existingSearch } = await supabase
            .from('saved_searches')
            .select('id')
            .eq('user_id', user.id)
            .eq('job_title', combinedQuery)
            .eq('location', params.location || '')
            .eq('country', params.country)
            .eq('language', params.language)
            .eq('date_posted', params.date_posted)
            .maybeSingle();

          if (!existingSearch) {
            await supabase.from('saved_searches').insert({
              user_id: user.id,
              job_title: combinedQuery,
              location: params.location,
              country: params.country,
              language: params.language,
              date_posted: params.date_posted,
            });
            console.log('Search saved automatically');
          } else {
            console.log('Search already exists, skipping save');
          }
        } catch (saveError) {
          // Don't fail the search if saving fails
          console.error('Failed to auto-save search:', saveError);
        }
      }
      
      toast({
        title: 'Search Complete',
        description: `Found ${allJobs.length} unique jobs from ${titlesToSearch.length} job title searches`,
      });

      return allJobs;
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

  const loadMoreJobs = async (page: number): Promise<Job[]> => {
    if (!searchParams) {
      toast({
        title: 'No search to continue',
        description: 'Please perform a search first',
        variant: 'destructive',
      });
      return [];
    }

    try {
      const { data, error } = await supabase.functions.invoke('search-jobs', {
        body: { ...searchParams, page },
      });

      if (error) throw error;
      if (data.error) throw new Error(data.error);

      const response = data as SearchResponse;
      return response.data || [];
    } catch (error) {
      console.error('Load more jobs error:', error);
      toast({
        title: 'Failed to load more jobs',
        description: error instanceof Error ? error.message : 'Failed to fetch additional jobs',
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
    loadMoreJobs,
    setJobs,
  };
}
