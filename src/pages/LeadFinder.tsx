import { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { Header } from '@/components/Header';
import { LeadFilters } from '@/components/leads/LeadFilters';
import { LeadTable } from '@/components/leads/LeadTable';
import { ExportButton } from '@/components/leads/ExportButton';
import { useLeadSearch, type LeadFilters as LeadFiltersType } from '@/hooks/useLeadSearch';
import { useAuth } from '@/hooks/useAuth';
import { Target } from 'lucide-react';

export default function LeadFinder() {
  const { user, loading: authLoading } = useAuth();
  const {
    leads,
    loading,
    error,
    profiles,
    profilesLoading,
    fetchProfiles,
    searchLeads,
    exportToCsv,
  } = useLeadSearch();

  const [filters, setFilters] = useState<LeadFiltersType>({
    profileId: '',
    country: 'all',
    minJobs: 1,
    hasWebsite: false,
    daysPosted: null,
  });

  useEffect(() => {
    if (user) {
      fetchProfiles();
    }
  }, [user]);

  if (authLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-pulse text-muted-foreground">Loading...</div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  const handleSearch = () => {
    if (filters.profileId) {
      searchLeads(filters);
    }
  };

  const totalJobs = leads.reduce((sum, lead) => sum + lead.job_count, 0);

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="container mx-auto px-4 py-8 max-w-7xl">
        {/* Page Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-primary text-primary-foreground">
              <Target className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-2xl font-semibold text-foreground">Lead Finder</h1>
              <p className="text-sm text-muted-foreground">
                Find companies hiring in your candidate segments
              </p>
            </div>
          </div>
          <ExportButton 
            onExport={exportToCsv} 
            disabled={leads.length === 0} 
            count={leads.length}
          />
        </div>

        {/* Filters Card */}
        <div className="bg-card border rounded-lg p-6 mb-6">
          <LeadFilters
            profiles={profiles}
            profilesLoading={profilesLoading}
            filters={filters}
            onFiltersChange={setFilters}
            onSearch={handleSearch}
            loading={loading}
          />
        </div>

        {/* Results Summary */}
        {leads.length > 0 && (
          <div className="mb-4 text-sm text-muted-foreground">
            Found <span className="font-medium text-foreground">{leads.length}</span> companies 
            with <span className="font-medium text-foreground">{totalJobs}</span> open positions
          </div>
        )}

        {/* Error Display */}
        {error && (
          <div className="mb-4 p-4 bg-destructive/10 border border-destructive/20 rounded-lg text-destructive">
            {error}
          </div>
        )}

        {/* Results Table */}
        <LeadTable leads={leads} loading={loading} />
      </main>
    </div>
  );
}
