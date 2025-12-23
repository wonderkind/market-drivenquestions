import { useEffect, useState, useRef } from 'react';
import { Navigate } from 'react-router-dom';
import { Header } from '@/components/Header';
import { LeadFilters } from '@/components/leads/LeadFilters';
import { LeadTable } from '@/components/leads/LeadTable';
import { ExportButton } from '@/components/leads/ExportButton';
import { useLeadSearch, type LeadFilters as LeadFiltersType } from '@/hooks/useLeadSearch';
import { useAuth } from '@/hooks/useAuth';
import { Target, TrendingUp, Building2, Flame } from 'lucide-react';

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
    sortField,
    sortOrder,
    updateSort,
  } = useLeadSearch();

  const [filters, setFilters] = useState<LeadFiltersType>({
    profileId: '',
    country: 'all',
    minJobs: 1,
    hasWebsite: false,
    daysPosted: null,
  });

  const previousFiltersRef = useRef<string>('');

  useEffect(() => {
    if (user) {
      fetchProfiles();
    }
  }, [user]);

  // Auto-trigger search when profile and country are selected
  useEffect(() => {
    if (filters.profileId && filters.country) {
      const filterKey = JSON.stringify(filters);
      if (filterKey !== previousFiltersRef.current) {
        previousFiltersRef.current = filterKey;
        searchLeads(filters);
      }
    }
  }, [filters]);

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
      previousFiltersRef.current = JSON.stringify(filters);
      searchLeads(filters);
    }
  };

  const totalJobs = leads.reduce((sum, lead) => sum + lead.job_count, 0);
  const hotLeads = leads.filter(l => l.recent_jobs_7d > 0).length;
  const activeLeads = leads.filter(l => l.recent_jobs_30d > 0).length;

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
              <h1 className="text-2xl font-semibold text-foreground">Lead Intelligence</h1>
              <p className="text-sm text-muted-foreground">
                Find companies actively hiring in your candidate segments
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

        {/* Results Summary with Metrics */}
        {leads.length > 0 && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-card border rounded-lg p-4">
              <div className="flex items-center gap-2 text-muted-foreground text-sm mb-1">
                <Building2 className="h-4 w-4" />
                Companies
              </div>
              <div className="text-2xl font-semibold text-foreground">{leads.length}</div>
            </div>
            <div className="bg-card border rounded-lg p-4">
              <div className="flex items-center gap-2 text-muted-foreground text-sm mb-1">
                <TrendingUp className="h-4 w-4" />
                Open Positions
              </div>
              <div className="text-2xl font-semibold text-foreground">{totalJobs}</div>
            </div>
            <div className="bg-card border rounded-lg p-4">
              <div className="flex items-center gap-2 text-muted-foreground text-sm mb-1">
                <Flame className="h-4 w-4 text-orange-500" />
                Hot Leads (7d)
              </div>
              <div className="text-2xl font-semibold text-foreground">{hotLeads}</div>
            </div>
            <div className="bg-card border rounded-lg p-4">
              <div className="flex items-center gap-2 text-muted-foreground text-sm mb-1">
                <TrendingUp className="h-4 w-4 text-green-500" />
                Active (30d)
              </div>
              <div className="text-2xl font-semibold text-foreground">{activeLeads}</div>
            </div>
          </div>
        )}

        {/* Error Display */}
        {error && (
          <div className="mb-4 p-4 bg-destructive/10 border border-destructive/20 rounded-lg text-destructive">
            {error}
          </div>
        )}

        {/* Results Table */}
        <LeadTable 
          leads={leads} 
          loading={loading} 
          sortField={sortField}
          sortOrder={sortOrder}
          onSort={updateSort}
        />
      </main>
    </div>
  );
}
