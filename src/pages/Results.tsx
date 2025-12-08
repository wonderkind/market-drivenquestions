import { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Header } from '@/components/Header';
import { SearchForm } from '@/components/SearchForm';
import { JobList } from '@/components/JobList';
import { useJobSearch } from '@/hooks/useJobSearch';
import { useFavorites } from '@/hooks/useFavorites';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { ArrowLeft, Brain, Save, Briefcase } from 'lucide-react';
import { SearchParams } from '@/types/job';

export default function Results() {
  const navigate = useNavigate();
  const location = useLocation();
  const { jobs, loading, translating, searchParams, searchJobs, translateProfile, setJobs } = useJobSearch();
  const { isFavorite, toggleFavorite } = useFavorites();
  const { user } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    const state = location.state as { jobs?: typeof jobs; searchParams?: SearchParams } | null;
    if (state?.jobs) {
      setJobs(state.jobs);
    }
  }, [location.state, setJobs]);

  const handleAnalyze = () => {
    if (jobs.length === 0) {
      toast({
        title: 'No jobs to analyze',
        description: 'Please search for jobs first',
        variant: 'destructive',
      });
      return;
    }
    navigate('/analysis', { state: { jobs, searchParams } });
  };

  const handleSaveSearch = async () => {
    if (!user) {
      toast({
        title: 'Sign in required',
        description: 'Please sign in to save searches',
        variant: 'destructive',
      });
      return;
    }

    if (!searchParams) {
      toast({
        title: 'No search to save',
        description: 'Please perform a search first',
        variant: 'destructive',
      });
      return;
    }

    try {
      const { error } = await supabase.from('saved_searches').insert({
        user_id: user.id,
        job_title: searchParams.query,
        location: searchParams.location,
        country: searchParams.country,
        language: searchParams.language,
        date_posted: searchParams.date_posted,
      });

      if (error) throw error;

      toast({
        title: 'Search saved',
        description: 'You can access this search from your dashboard',
      });
    } catch (error) {
      console.error('Error saving search:', error);
      toast({
        title: 'Error',
        description: 'Failed to save search',
        variant: 'destructive',
      });
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container mx-auto px-4 py-8">
        <Button
          variant="ghost"
          onClick={() => navigate('/')}
          className="mb-6 gap-2"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Home
        </Button>

        <div className="grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-1">
            <div className="sticky top-4 space-y-4">
              <SearchForm 
                onSearch={searchJobs} 
                onTranslateProfile={(profile, country, language) => translateProfile({ profile, country, language })}
                loading={loading} 
                translating={translating}
              />
              
              {jobs.length > 0 && (
                <div className="flex flex-col gap-2">
                  <Button onClick={handleAnalyze} className="w-full gap-2">
                    <Brain className="h-4 w-4" />
                    Analyze Jobs with AI
                  </Button>
                  <Button
                    variant="outline"
                    onClick={handleSaveSearch}
                    className="w-full gap-2"
                  >
                    <Save className="h-4 w-4" />
                    Save This Search
                  </Button>
                </div>
              )}
            </div>
          </div>

          <div className="lg:col-span-2">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-xl font-semibold text-foreground flex items-center gap-2">
                <Briefcase className="h-5 w-5" />
                {jobs.length > 0 ? `${jobs.length} Jobs Found` : 'Search Results'}
              </h2>
            </div>
            <JobList
              jobs={jobs}
              isFavorite={isFavorite}
              onToggleFavorite={toggleFavorite}
            />
          </div>
        </div>
      </main>
    </div>
  );
}
