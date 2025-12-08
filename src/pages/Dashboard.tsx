import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Header } from '@/components/Header';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { SavedQuestionsData } from '@/types/job';
import { Plus, FolderOpen, Globe, Languages, MessageSquare, Briefcase, Trash2, RefreshCw } from 'lucide-react';

interface ProfileCatalogItem {
  id: string;
  profile: string;
  country: string;
  language: string;
  questionsCount: number;
  jobsCount: number;
  createdAt: string;
  type: 'analysis' | 'search';
}

const countries: Record<string, { label: string; flag: string }> = {
  nl: { label: 'NL', flag: '🇳🇱' },
  de: { label: 'DE', flag: '🇩🇪' },
  be: { label: 'BE', flag: '🇧🇪' },
  gb: { label: 'GB', flag: '🇬🇧' },
  us: { label: 'US', flag: '🇺🇸' },
  fr: { label: 'FR', flag: '🇫🇷' },
};

const languageLabels: Record<string, string> = {
  en: 'EN',
  nl: 'NL',
  de: 'DE',
  fr: 'FR',
};

export default function Dashboard() {
  const [profiles, setProfiles] = useState<ProfileCatalogItem[]>([]);
  const [loading, setLoading] = useState(true);
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/auth');
    }
  }, [user, authLoading, navigate]);

  useEffect(() => {
    if (user) {
      fetchProfiles();
    }
  }, [user]);

  const fetchProfiles = async () => {
    if (!user) return;
    setLoading(true);

    try {
      // Fetch analysis results (saved profiles with questions)
      const { data: analysisData, error: analysisError } = await supabase
        .from('analysis_results')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (analysisError) throw analysisError;

      const catalogItems: ProfileCatalogItem[] = (analysisData || []).map((item) => {
        const data = item.analysis_data as unknown as SavedQuestionsData;
        const questions = data.questions || {} as any;
        const questionsCount =
          (questions.license?.questions?.length || 0) +
          (questions.qualification?.questions?.length || 0) +
          (questions.certification?.questions?.length || 0);

        return {
          id: item.id,
          profile: data.profile || 'Unknown Profile',
          country: data.country || 'nl',
          language: data.language || 'en',
          questionsCount,
          jobsCount: data.jobsScrapedCount || 0,
          createdAt: item.created_at,
          type: 'analysis' as const,
        };
      });

      setProfiles(catalogItems);
    } catch (error) {
      console.error('Error fetching profiles:', error);
      toast({
        title: 'Error',
        description: 'Failed to load your profiles',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleRowClick = (item: ProfileCatalogItem) => {
    navigate(`/profile/${item.id}`);
  };

  const handleCreate = () => {
    navigate('/create-profile');
  };

  const handleReanalyse = (item: ProfileCatalogItem) => {
    navigate('/create-profile', {
      state: {
        profile: item.profile,
        country: item.country,
        language: item.language,
        profileId: item.id,
      },
    });
  };

  const handleDelete = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();

    try {
      const { error } = await supabase.from('analysis_results').delete().eq('id', id);

      if (error) throw error;

      setProfiles((prev) => prev.filter((p) => p.id !== id));
      toast({ title: 'Profile deleted' });
    } catch (error) {
      console.error('Error deleting profile:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete profile',
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
            <div className="h-64 bg-muted rounded" />
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container mx-auto px-4 py-8">
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2 text-2xl">
                  <FolderOpen className="h-6 w-6 text-primary" />
                  Profiles Catalog
                </CardTitle>
                <CardDescription>
                  {profiles.length} profile{profiles.length !== 1 ? 's' : ''} saved
                </CardDescription>
              </div>
              <Button onClick={() => handleCreate()} className="gap-2">
                <Plus className="h-4 w-4" />
                Create New Profile
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {profiles.length === 0 ? (
              <div className="text-center py-12">
                <FolderOpen className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
                <p className="text-muted-foreground mb-4">No profiles yet</p>
                <Button onClick={() => handleCreate()} className="gap-2">
                  <Plus className="h-4 w-4" />
                  Create Your First Profile
                </Button>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[40%]">Profile</TableHead>
                    <TableHead>
                      <span className="flex items-center gap-1">
                        <Globe className="h-4 w-4" />
                        Country
                      </span>
                    </TableHead>
                    <TableHead>
                      <span className="flex items-center gap-1">
                        <Languages className="h-4 w-4" />
                        Language
                      </span>
                    </TableHead>
                    <TableHead>
                      <span className="flex items-center gap-1">
                        <MessageSquare className="h-4 w-4" />
                        Questions
                      </span>
                    </TableHead>
                    <TableHead>
                      <span className="flex items-center gap-1">
                        <Briefcase className="h-4 w-4" />
                        Jobs
                      </span>
                    </TableHead>
                    <TableHead className="text-right">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {profiles.map((item) => {
                    const countryInfo = countries[item.country] || {
                      label: item.country.toUpperCase(),
                      flag: '🌍',
                    };

                    return (
                      <TableRow
                        key={item.id}
                        className="cursor-pointer hover:bg-muted/50"
                        onClick={() => handleRowClick(item)}
                      >
                        <TableCell className="font-medium">{item.profile}</TableCell>
                        <TableCell>
                          <span className="flex items-center gap-1">
                            {countryInfo.flag} {countryInfo.label}
                          </span>
                        </TableCell>
                        <TableCell>
                          {languageLabels[item.language] || item.language.toUpperCase()}
                        </TableCell>
                        <TableCell>{item.questionsCount}</TableCell>
                        <TableCell>{item.jobsCount}</TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleReanalyse(item);
                              }}
                            >
                              <RefreshCw className="h-4 w-4 mr-1" />
                              Re-analyse
                            </Button>
                            <Button
                              size="icon"
                              variant="ghost"
                              className="h-8 w-8 text-destructive hover:text-destructive"
                              onClick={(e) => handleDelete(e, item.id)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
