import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Job } from '@/types/job';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';

export function useFavorites() {
  const [favorites, setFavorites] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    if (user) {
      fetchFavorites();
    } else {
      setFavorites([]);
    }
  }, [user]);

  const fetchFavorites = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('favorite_jobs')
        .select('job_id')
        .eq('user_id', user.id);

      if (error) throw error;
      setFavorites(data?.map((f) => f.job_id) || []);
    } catch (error) {
      console.error('Error fetching favorites:', error);
    }
  };

  const toggleFavorite = async (job: Job) => {
    if (!user) {
      toast({
        title: 'Sign in required',
        description: 'Please sign in to save favorites',
        variant: 'destructive',
      });
      return;
    }

    setLoading(true);
    const isFavorite = favorites.includes(job.job_id);

    try {
      if (isFavorite) {
        const { error } = await supabase
          .from('favorite_jobs')
          .delete()
          .eq('user_id', user.id)
          .eq('job_id', job.job_id);

        if (error) throw error;
        setFavorites((prev) => prev.filter((id) => id !== job.job_id));
        toast({ title: 'Removed from favorites' });
      } else {
        const { error } = await supabase
          .from('favorite_jobs')
          .insert({
            user_id: user.id,
            job_id: job.job_id,
            job_title: job.job_title,
            employer_name: job.employer_name,
            employer_logo: job.employer_logo,
            job_location: job.job_location,
            job_employment_type: job.job_employment_type,
            job_apply_link: job.job_apply_link,
            job_description: job.job_description,
            job_posted_at: job.job_posted_at,
          });

        if (error) throw error;
        setFavorites((prev) => [...prev, job.job_id]);
        toast({ title: 'Added to favorites' });
      }
    } catch (error) {
      console.error('Error toggling favorite:', error);
      toast({
        title: 'Error',
        description: 'Failed to update favorites',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const isFavorite = (jobId: string) => favorites.includes(jobId);

  return {
    favorites,
    loading,
    toggleFavorite,
    isFavorite,
    fetchFavorites,
  };
}
