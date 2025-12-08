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
import { Plus, FolderOpen } from 'lucide-react';

interface CountryAnalysis {
  status: 'not_created' | 'analysed';
  analysisId?: string;
  questionsCount?: number;
  jobsCount?: number;
  language?: string;
}

interface ProfileMatrix {
  profileName: string;
  countries: Record<string, CountryAnalysis>;
}

export default function Dashboard() {
  const [profilesMatrix, setProfilesMatrix] = useState<ProfileMatrix[]>([]);
  const [loading, setLoading] = useState(true);
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
      fetchProfiles();
    }
  }, [user]);

  const fetchProfiles = async () => {
    if (!user) return;
    setLoading(true);

    try {
      const { data: analysisData, error: analysisError } = await supabase
        .from('analysis_results')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (analysisError) throw analysisError;

      // Group analyses by profile name
      const profileMap = new Map<string, ProfileMatrix>();

      for (const item of analysisData || []) {
        const data = item.analysis_data as unknown as SavedQuestionsData;
        const profileName = data.profile || 'Unknown Profile';
        const country = data.country || 'nl';
        const questions = data.questions || {} as any;
        const questionsCount =
          (questions.license?.questions?.length || 0) +
          (questions.qualification?.questions?.length || 0) +
          (questions.certification?.questions?.length || 0);

        if (!profileMap.has(profileName)) {
          profileMap.set(profileName, {
            profileName,
            countries: {},
          });
        }

        const profile = profileMap.get(profileName)!;
        profile.countries[country] = {
          status: 'analysed',
          analysisId: item.id,
          questionsCount,
          jobsCount: data.jobsScrapedCount || 0,
          language: data.language || 'en',
        };
      }

      setProfilesMatrix(Array.from(profileMap.values()));
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

  const filteredProfiles = useMemo(() => {
    return profilesMatrix.filter((profile) => {
      // Search filter
      if (searchQuery && !profile.profileName.toLowerCase().includes(searchQuery.toLowerCase())) {
        return false;
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
          (c) => !profile.countries[c.code] || profile.countries[c.code].status === 'not_created'
        );

        if (statusFilter === 'analysed' && !hasAnyAnalysed) return false;
        if (statusFilter === 'not_created' && !hasAnyNotCreated) return false;
      }

      return true;
    });
  }, [profilesMatrix, searchQuery, statusFilter, countryFilter]);

  const handleCellClick = (profileName: string, countryCode: string, analysis?: CountryAnalysis) => {
    if (analysis?.status === 'analysed' && analysis.analysisId) {
      navigate(`/profile/${analysis.analysisId}`);
    } else {
      navigate('/create-profile', {
        state: {
          profile: profileName,
          country: countryCode,
          language: countryCode === 'nl' ? 'nl' : countryCode === 'de' ? 'de' : 'en',
        },
      });
    }
  };

  const handleCreate = () => {
    navigate('/create-profile');
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
                  ONET-SOC Profiles
                </CardTitle>
                <CardDescription>
                  {profilesMatrix.length} profile{profilesMatrix.length !== 1 ? 's' : ''} created
                </CardDescription>
              </div>
              <Button onClick={handleCreate} className="gap-2">
                <Plus className="h-4 w-4" />
                New Profile
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

            {filteredProfiles.length === 0 ? (
              <div className="text-center py-12">
                <FolderOpen className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
                <p className="text-muted-foreground mb-4">
                  {profilesMatrix.length === 0 ? 'No profiles yet' : 'No profiles match your filters'}
                </p>
                {profilesMatrix.length === 0 && (
                  <Button onClick={handleCreate} className="gap-2">
                    <Plus className="h-4 w-4" />
                    Create Your First Profile
                  </Button>
                )}
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="min-w-[250px]">ONET-SOC Profile</TableHead>
                      {SUPPORTED_COUNTRIES.map((country) => (
                        <TableHead key={country.code} className="text-center min-w-[120px]">
                          <span className="flex items-center justify-center gap-1">
                            {country.flag} {country.code.toUpperCase()}
                          </span>
                        </TableHead>
                      ))}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredProfiles.map((profile) => (
                      <TableRow key={profile.profileName}>
                        <TableCell className="font-medium">{profile.profileName}</TableCell>
                        {SUPPORTED_COUNTRIES.map((country) => (
                          <TableCell key={country.code} className="p-2">
                            <CountryStatusCell
                              analysis={profile.countries[country.code]}
                              onClick={() =>
                                handleCellClick(
                                  profile.profileName,
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
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
