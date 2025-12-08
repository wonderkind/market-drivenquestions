import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Header } from '@/components/Header';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useJobSearch } from '@/hooks/useJobSearch';
import {
  Search,
  Heart,
  Clock,
  Trash2,
  Play,
  MapPin,
  Building,
  ExternalLink,
} from 'lucide-react';

interface SavedSearch {
  id: string;
  job_title: string;
  location: string | null;
  country: string;
  language: string;
  date_posted: string;
  created_at: string;
}

interface FavoriteJob {
  id: string;
  job_id: string;
  job_title: string;
  employer_name: string | null;
  job_location: string | null;
  job_apply_link: string | null;
  created_at: string;
}

export default function Dashboard() {
  const [savedSearches, setSavedSearches] = useState<SavedSearch[]>([]);
  const [favoriteJobs, setFavoriteJobs] = useState<FavoriteJob[]>([]);
  const [loading, setLoading] = useState(true);
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { searchJobs } = useJobSearch();

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/auth');
    }
  }, [user, authLoading, navigate]);

  useEffect(() => {
    if (user) {
      fetchData();
    }
  }, [user]);

  const fetchData = async () => {
    if (!user) return;
    setLoading(true);

    try {
      const [searchesResult, favoritesResult] = await Promise.all([
        supabase
          .from('saved_searches')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false }),
        supabase
          .from('favorite_jobs')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false }),
      ]);

      if (searchesResult.error) throw searchesResult.error;
      if (favoritesResult.error) throw favoritesResult.error;

      setSavedSearches(searchesResult.data || []);
      setFavoriteJobs(favoritesResult.data || []);
    } catch (error) {
      console.error('Error fetching data:', error);
      toast({
        title: 'Error',
        description: 'Failed to load your data',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleRunSearch = async (search: SavedSearch) => {
    const jobs = await searchJobs({
      query: search.job_title,
      location: search.location || '',
      country: search.country,
      language: search.language,
      date_posted: search.date_posted,
    });

    navigate('/results', {
      state: {
        jobs,
        searchParams: {
          query: search.job_title,
          location: search.location || '',
          country: search.country,
          language: search.language,
          date_posted: search.date_posted,
        },
      },
    });
  };

  const handleDeleteSearch = async (id: string) => {
    try {
      const { error } = await supabase
        .from('saved_searches')
        .delete()
        .eq('id', id);

      if (error) throw error;

      setSavedSearches((prev) => prev.filter((s) => s.id !== id));
      toast({ title: 'Search deleted' });
    } catch (error) {
      console.error('Error deleting search:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete search',
        variant: 'destructive',
      });
    }
  };

  const handleRemoveFavorite = async (id: string) => {
    try {
      const { error } = await supabase
        .from('favorite_jobs')
        .delete()
        .eq('id', id);

      if (error) throw error;

      setFavoriteJobs((prev) => prev.filter((f) => f.id !== id));
      toast({ title: 'Removed from favorites' });
    } catch (error) {
      console.error('Error removing favorite:', error);
      toast({
        title: 'Error',
        description: 'Failed to remove favorite',
        variant: 'destructive',
      });
    }
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="container mx-auto px-4 py-8">
          <div className="animate-pulse space-y-4">
            <div className="h-8 w-48 bg-muted rounded" />
            <div className="h-32 bg-muted rounded" />
            <div className="h-32 bg-muted rounded" />
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold text-foreground mb-8">Dashboard</h1>

        <div className="grid gap-8 lg:grid-cols-2">
          {/* Saved Searches */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Search className="h-5 w-5" />
                Saved Searches
              </CardTitle>
              <CardDescription>
                {savedSearches.length} saved search{savedSearches.length !== 1 ? 'es' : ''}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {savedSearches.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Search className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No saved searches yet</p>
                  <Button
                    variant="link"
                    onClick={() => navigate('/')}
                    className="mt-2"
                  >
                    Start searching
                  </Button>
                </div>
              ) : (
                <div className="space-y-3">
                  {savedSearches.map((search) => (
                    <div
                      key={search.id}
                      className="flex items-center justify-between p-3 rounded-lg bg-muted/50"
                    >
                      <div className="space-y-1">
                        <p className="font-medium text-foreground">
                          {search.job_title}
                        </p>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          {search.location && (
                            <span className="flex items-center gap-1">
                              <MapPin className="h-3 w-3" />
                              {search.location}
                            </span>
                          )}
                          <span className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {new Date(search.created_at).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleRunSearch(search)}
                        >
                          <Play className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDeleteSearch(search.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Favorite Jobs */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Heart className="h-5 w-5" />
                Favorite Jobs
              </CardTitle>
              <CardDescription>
                {favoriteJobs.length} saved job{favoriteJobs.length !== 1 ? 's' : ''}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {favoriteJobs.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Heart className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No favorite jobs yet</p>
                  <Button
                    variant="link"
                    onClick={() => navigate('/')}
                    className="mt-2"
                  >
                    Find jobs to save
                  </Button>
                </div>
              ) : (
                <div className="space-y-3">
                  {favoriteJobs.map((job) => (
                    <div
                      key={job.id}
                      className="flex items-center justify-between p-3 rounded-lg bg-muted/50"
                    >
                      <div className="space-y-1">
                        <p className="font-medium text-foreground">
                          {job.job_title}
                        </p>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          {job.employer_name && (
                            <span className="flex items-center gap-1">
                              <Building className="h-3 w-3" />
                              {job.employer_name}
                            </span>
                          )}
                          {job.job_location && (
                            <span className="flex items-center gap-1">
                              <MapPin className="h-3 w-3" />
                              {job.job_location}
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {job.job_apply_link && (
                          <Button variant="ghost" size="icon" asChild>
                            <a
                              href={job.job_apply_link}
                              target="_blank"
                              rel="noopener noreferrer"
                            >
                              <ExternalLink className="h-4 w-4" />
                            </a>
                          </Button>
                        )}
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleRemoveFavorite(job.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
