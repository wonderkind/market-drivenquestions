import { useState, useEffect, useMemo } from 'react';
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
import { DashboardFilters, SUPPORTED_COUNTRIES } from '@/components/DashboardFilters';
import { CountryStatusCell } from '@/components/CountryStatusCell';
import { FolderOpen, RefreshCw, Loader2 } from 'lucide-react';

interface CountryAnalysis {
  status: 'not_created' | 'analysed';
  analysisId?: string;
  questionsCount?: number;
  jobsCount?: number;
  language?: string;
}

interface OnetOccupation {
  id: string;
  code: string;
  title: string;
  job_zone: number | null;
  has_data: boolean;
}

interface ProfileMatrix {
  code: string;
  title: string;
  jobZone: number | null;
  countries: Record<string, CountryAnalysis>;
}

export default function Dashboard() {
  const [profilesMatrix, setProfilesMatrix] = useState<ProfileMatrix[]>([]);
  const [loading, setLoading] = useState(true);
  const [seeding, setSeeding] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'analysed' | 'not_created'>('all');
  const [countryFilter, setCountryFilter] = useState('all');
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
      fetchData();
    }
  }, [user]);

  const seedOccupations = async () => {
    setSeeding(true);
    try {
      const response = await supabase.functions.invoke('seed-onet-occupations');
      if (response.error) throw response.error;
      
      toast({
        title: 'Success',
        description: `Loaded ${response.data?.count || 0} O*NET occupations`,
      });
      
      await fetchData();
    } catch (error) {
      console.error('Error seeding occupations:', error);
      toast({
        title: 'Error',
        description: 'Failed to load O*NET occupations',
        variant: 'destructive',
      });
    } finally {
      setSeeding(false);
    }
  };

  const fetchData = async () => {
    if (!user) return;
    setLoading(true);

    try {
      // Fetch all O*NET occupations
      const { data: occupations, error: occError } = await supabase
        .from('onet_occupations')
        .select('*')
        .order('title');

      if (occError) throw occError;

      // Fetch user's analysis results
      const { data: analysisData, error: analysisError } = await supabase
        .from('analysis_results')
        .select('*')
        .eq('user_id', user.id);

      if (analysisError) throw analysisError;

      // Create a map of analyses by profile name and country
      const analysisMap = new Map<string, Map<string, { id: string; questionsCount: number; jobsCount: number; language: string }>>();
      
      for (const item of analysisData || []) {
        const data = item.analysis_data as unknown as SavedQuestionsData;
        const profileName = (data.profile || '').toLowerCase();
        const country = data.country || 'nl';
        const questions = data.questions || {} as any;
        const questionsCount =
          (questions.license?.questions?.length || 0) +
          (questions.qualification?.questions?.length || 0) +
          (questions.certification?.questions?.length || 0);

        if (!analysisMap.has(profileName)) {
          analysisMap.set(profileName, new Map());
        }
        
        analysisMap.get(profileName)!.set(country, {
          id: item.id,
          questionsCount,
          jobsCount: data.jobsScrapedCount || 0,
          language: data.language || 'en',
        });
      }

      // Build the matrix combining occupations with analyses
      const matrix: ProfileMatrix[] = (occupations || []).map((occ: OnetOccupation) => {
        const occAnalyses = analysisMap.get(occ.title.toLowerCase());
        const countries: Record<string, CountryAnalysis> = {};

        SUPPORTED_COUNTRIES.forEach((country) => {
          const analysis = occAnalyses?.get(country.code);
          if (analysis) {
            countries[country.code] = {
              status: 'analysed',
              analysisId: analysis.id,
              questionsCount: analysis.questionsCount,
              jobsCount: analysis.jobsCount,
              language: analysis.language,
            };
          }
        });

        return {
          code: occ.code,
          title: occ.title,
          jobZone: occ.job_zone,
          countries,
        };
      });

      setProfilesMatrix(matrix);
    } catch (error) {
      console.error('Error fetching data:', error);
      toast({
        title: 'Error',
        description: 'Failed to load profiles',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const filteredProfiles = useMemo(() => {
    return profilesMatrix.filter((profile) => {
      // Search filter - search in both code and title
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        if (!profile.title.toLowerCase().includes(query) && !profile.code.toLowerCase().includes(query)) {
          return false;
        }
      }

      // Country filter
      if (countryFilter !== 'all') {
        const hasCountry = profile.countries[countryFilter]?.status === 'analysed';
        if (statusFilter === 'analysed' && !hasCountry) return false;
        if (statusFilter === 'not_created' && hasCountry) return false;
      }

      // Status filter (when no country filter)
      if (countryFilter === 'all' && statusFilter !== 'all') {
        const hasAnyAnalysed = Object.values(profile.countries).some(
          (c) => c.status === 'analysed'
        );
        const hasAnyNotCreated = SUPPORTED_COUNTRIES.some(
          (c) => !profile.countries[c.code] || profile.countries[c.code].status !== 'analysed'
        );

        if (statusFilter === 'analysed' && !hasAnyAnalysed) return false;
        if (statusFilter === 'not_created' && !hasAnyNotCreated) return false;
      }

      return true;
    });
  }, [profilesMatrix, searchQuery, statusFilter, countryFilter]);

  const handleCellClick = (profile: ProfileMatrix, countryCode: string, analysis?: CountryAnalysis) => {
    if (analysis?.status === 'analysed' && analysis.analysisId) {
      navigate(`/profile/${analysis.analysisId}`);
    } else {
      navigate('/create-profile', {
        state: {
          profile: profile.title,
          onetCode: profile.code,
          country: countryCode,
          language: countryCode === 'nl' ? 'nl' : countryCode === 'de' ? 'de' : 'en',
        },
      });
    }
  };

  const analysedCount = useMemo(() => {
    let count = 0;
    profilesMatrix.forEach((p) => {
      count += Object.values(p.countries).filter((c) => c.status === 'analysed').length;
    });
    return count;
  }, [profilesMatrix]);

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
                  O*NET-SOC Occupations
                </CardTitle>
                <CardDescription>
                  {profilesMatrix.length} occupations • {analysedCount} analyses completed
                </CardDescription>
              </div>
              <Button 
                onClick={seedOccupations} 
                variant="outline" 
                className="gap-2"
                disabled={seeding}
              >
                {seeding ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <RefreshCw className="h-4 w-4" />
                )}
                {seeding ? 'Loading...' : 'Refresh O*NET Data'}
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <DashboardFilters
              searchQuery={searchQuery}
              onSearchChange={setSearchQuery}
              statusFilter={statusFilter}
              onStatusFilterChange={setStatusFilter}
              countryFilter={countryFilter}
              onCountryFilterChange={setCountryFilter}
            />

            {profilesMatrix.length === 0 ? (
              <div className="text-center py-12">
                <FolderOpen className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
                <p className="text-muted-foreground mb-4">
                  No O*NET occupations loaded yet
                </p>
                <Button onClick={seedOccupations} className="gap-2" disabled={seeding}>
                  {seeding ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <RefreshCw className="h-4 w-4" />
                  )}
                  Load O*NET Occupations
                </Button>
              </div>
            ) : filteredProfiles.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-muted-foreground">No occupations match your filters</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[120px]">Code</TableHead>
                      <TableHead className="min-w-[250px]">Occupation</TableHead>
                      {SUPPORTED_COUNTRIES.map((country) => (
                        <TableHead key={country.code} className="text-center min-w-[100px]">
                          <span className="flex items-center justify-center gap-1">
                            {country.flag} {country.code.toUpperCase()}
                          </span>
                        </TableHead>
                      ))}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredProfiles.map((profile) => (
                      <TableRow key={profile.code}>
                        <TableCell className="font-mono text-sm text-muted-foreground">
                          {profile.code}
                        </TableCell>
                        <TableCell className="font-medium">{profile.title}</TableCell>
                        {SUPPORTED_COUNTRIES.map((country) => (
                          <TableCell key={country.code} className="p-2">
                            <CountryStatusCell
                              analysis={profile.countries[country.code]}
                              onClick={() =>
                                handleCellClick(
                                  profile,
                                  country.code,
                                  profile.countries[country.code]
                                )
                              }
                            />
                          </TableCell>
                        ))}
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
                <div className="mt-4 text-sm text-muted-foreground text-center">
                  Showing {filteredProfiles.length} of {profilesMatrix.length} occupations
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
