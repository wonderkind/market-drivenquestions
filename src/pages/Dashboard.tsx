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
import { TablePagination } from '@/components/TablePagination';
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
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(25);
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

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, statusFilter, countryFilter, itemsPerPage]);

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

  // Paginated profiles
  const paginatedProfiles = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredProfiles.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredProfiles, currentPage, itemsPerPage]);

  const totalPages = Math.ceil(filteredProfiles.length / itemsPerPage);

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
        <main className="container mx-auto px-4 py-8 max-w-7xl">
          <Card>
            <CardHeader>
              <div className="animate-pulse space-y-3">
                <div className="h-7 w-64 bg-muted rounded" />
                <div className="h-4 w-48 bg-muted rounded" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="animate-pulse space-y-4">
                <div className="flex gap-4">
                  <div className="h-10 flex-1 bg-muted rounded" />
                  <div className="h-10 w-40 bg-muted rounded" />
                  <div className="h-10 w-40 bg-muted rounded" />
                </div>
                <div className="space-y-2">
                  {Array.from({ length: 8 }).map((_, i) => (
                    <div key={i} className="h-12 bg-muted rounded" />
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container mx-auto px-4 py-8 max-w-7xl">
        <Card className="shadow-sm">
          <CardHeader className="border-b border-border bg-card">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <CardTitle className="flex items-center gap-2 text-2xl">
                  <FolderOpen className="h-6 w-6 text-primary" />
                  O*NET-SOC Occupations
                </CardTitle>
                <CardDescription className="mt-1">
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
          <CardContent className="p-6">
            <DashboardFilters
              searchQuery={searchQuery}
              onSearchChange={setSearchQuery}
              statusFilter={statusFilter}
              onStatusFilterChange={setStatusFilter}
              countryFilter={countryFilter}
              onCountryFilterChange={setCountryFilter}
            />

            {profilesMatrix.length === 0 ? (
              <div className="text-center py-16">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-muted mb-4">
                  <FolderOpen className="h-8 w-8 text-muted-foreground" />
                </div>
                <h3 className="text-lg font-medium text-foreground mb-2">No occupations loaded</h3>
                <p className="text-muted-foreground mb-6 max-w-sm mx-auto">
                  Load O*NET occupations to start creating job profiles and analyses.
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
              <div className="text-center py-16">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-muted mb-4">
                  <FolderOpen className="h-8 w-8 text-muted-foreground" />
                </div>
                <h3 className="text-lg font-medium text-foreground mb-2">No results found</h3>
                <p className="text-muted-foreground">Try adjusting your search or filters</p>
              </div>
            ) : (
              <>
                <div className="overflow-x-auto rounded-lg border border-border">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-muted/50 hover:bg-muted/50">
                        <TableHead className="w-[120px] font-semibold">Code</TableHead>
                        <TableHead className="min-w-[280px] font-semibold">Occupation</TableHead>
                        {SUPPORTED_COUNTRIES.map((country) => (
                          <TableHead key={country.code} className="text-center min-w-[110px] font-semibold">
                            <span className="flex items-center justify-center gap-1.5">
                              <span className="text-base">{country.flag}</span>
                              <span>{country.code.toUpperCase()}</span>
                            </span>
                          </TableHead>
                        ))}
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {paginatedProfiles.map((profile, index) => (
                        <TableRow 
                          key={profile.code}
                          className={index % 2 === 0 ? 'bg-background' : 'bg-muted/20'}
                        >
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
                </div>

                <TablePagination
                  currentPage={currentPage}
                  totalPages={totalPages}
                  totalItems={filteredProfiles.length}
                  itemsPerPage={itemsPerPage}
                  onPageChange={setCurrentPage}
                  onItemsPerPageChange={setItemsPerPage}
                  itemsPerPageOptions={[25, 50, 100]}
                />
              </>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
