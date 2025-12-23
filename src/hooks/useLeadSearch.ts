import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface Lead {
  employer_name: string;
  employer_website: string | null;
  employer_logo: string | null;
  job_count: number;
  job_titles: string[];
  locations: string[];
  job_country: string;
  latest_job_posted: string | null;
  recent_jobs_7d: number;
  recent_jobs_30d: number;
  matching_titles_count: number;
}

export interface LeadFilters {
  profileId: string;
  country: string;
  minJobs: number;
  hasWebsite: boolean;
  daysPosted: number | null;
}

export interface ProfileOption {
  id: string;
  name: string;
  country: string;
  created_at: string;
}

export type SortField = 'job_count' | 'recent_jobs_7d' | 'latest_job_posted' | 'employer_name';
export type SortOrder = 'asc' | 'desc';

export function useLeadSearch() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [profiles, setProfiles] = useState<ProfileOption[]>([]);
  const [profilesLoading, setProfilesLoading] = useState(false);
  const [sortField, setSortField] = useState<SortField>('job_count');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');

  const fetchProfiles = async () => {
    setProfilesLoading(true);
    try {
      const { data, error } = await supabase
        .from('analysis_results')
        .select('id, analysis_data, created_at')
        .order('created_at', { ascending: false });

      if (error) throw error;

      const profileOptions: ProfileOption[] = (data || []).map((item) => {
        const analysisData = item.analysis_data as { profile?: string; country?: string };
        return {
          id: item.id,
          name: analysisData?.profile || 'Unknown Profile',
          country: analysisData?.country || 'unknown',
          created_at: item.created_at,
        };
      });

      setProfiles(profileOptions);
    } catch (err) {
      console.error('Error fetching profiles:', err);
    } finally {
      setProfilesLoading(false);
    }
  };

  const searchLeads = async (filters: LeadFilters) => {
    if (!filters.profileId) return;
    
    setLoading(true);
    setError(null);

    try {
      // Get the selected profile to find job titles
      const { data: profileData, error: profileError } = await supabase
        .from('analysis_results')
        .select('analysis_data')
        .eq('id', filters.profileId)
        .maybeSingle();

      if (profileError) throw profileError;
      if (!profileData) throw new Error('Profile not found');

      const analysisData = profileData.analysis_data as {
        profile?: string;
        translations?: { job_title?: string; country?: string }[];
      };

      // Build search patterns from profile translations for the target country
      const jobTitlePatterns: string[] = [];
      
      if (analysisData?.translations) {
        analysisData.translations.forEach(t => {
          if (t.job_title) {
            // Filter by target country if specified
            if (filters.country !== 'all') {
              if (t.country?.toUpperCase() === filters.country.toUpperCase()) {
                jobTitlePatterns.push(t.job_title.toLowerCase());
              }
            } else {
              jobTitlePatterns.push(t.job_title.toLowerCase());
            }
          }
        });
      }

      // If no translations found, use profile name keywords as fallback
      if (jobTitlePatterns.length === 0 && analysisData?.profile) {
        const keywords = analysisData.profile.split(/[\s,]+/).filter(w => w.length > 3);
        jobTitlePatterns.push(...keywords.slice(0, 5).map(k => k.toLowerCase()));
      }

      console.log('Searching with patterns:', jobTitlePatterns);

      // Query jobs table
      let query = supabase
        .from('jobs')
        .select('employer_name, employer_website, employer_logo, job_title, job_location, job_country, job_posted_at, created_at')
        .not('employer_name', 'is', null);

      if (filters.country && filters.country !== 'all') {
        query = query.ilike('job_country', filters.country);
      }

      if (filters.daysPosted) {
        const cutoffDate = new Date();
        cutoffDate.setDate(cutoffDate.getDate() - filters.daysPosted);
        query = query.gte('created_at', cutoffDate.toISOString());
      }

      const { data: jobsData, error: jobsError } = await query;

      if (jobsError) throw jobsError;

      // Calculate date thresholds for recency metrics
      const now = new Date();
      const days7Ago = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      const days30Ago = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

      // Filter jobs by matching patterns and aggregate by employer
      const employerMap = new Map<string, {
        employer_name: string;
        employer_website: string | null;
        employer_logo: string | null;
        job_titles: Set<string>;
        matching_titles: Set<string>;
        locations: Set<string>;
        job_country: string;
        latest_job_posted: string | null;
        job_count: number;
        recent_jobs_7d: number;
        recent_jobs_30d: number;
      }>();

      (jobsData || []).forEach(job => {
        if (!job.employer_name || !job.job_title) return;

        const jobTitleLower = job.job_title.toLowerCase();
        
        // Check if this job matches any of our patterns
        const isMatch = jobTitlePatterns.length === 0 || jobTitlePatterns.some(pattern => 
          jobTitleLower.includes(pattern) || pattern.includes(jobTitleLower.split(' ')[0])
        );
        
        if (!isMatch) return;

        const key = job.employer_name.toLowerCase().trim();
        const jobDate = job.created_at ? new Date(job.created_at) : null;
        
        if (!employerMap.has(key)) {
          employerMap.set(key, {
            employer_name: job.employer_name,
            employer_website: job.employer_website,
            employer_logo: job.employer_logo,
            job_titles: new Set(),
            matching_titles: new Set(),
            locations: new Set(),
            job_country: job.job_country || '',
            latest_job_posted: job.job_posted_at,
            job_count: 0,
            recent_jobs_7d: 0,
            recent_jobs_30d: 0,
          });
        }

        const employer = employerMap.get(key)!;
        employer.job_count++;
        if (job.job_title) {
          employer.job_titles.add(job.job_title);
          // Track which patterns this job matched
          const matchedPattern = jobTitlePatterns.find(p => jobTitleLower.includes(p));
          if (matchedPattern) employer.matching_titles.add(matchedPattern);
        }
        if (job.job_location) employer.locations.add(job.job_location);
        if (job.job_posted_at && (!employer.latest_job_posted || job.job_posted_at > employer.latest_job_posted)) {
          employer.latest_job_posted = job.job_posted_at;
        }
        
        // Track recency metrics
        if (jobDate) {
          if (jobDate >= days7Ago) employer.recent_jobs_7d++;
          if (jobDate >= days30Ago) employer.recent_jobs_30d++;
        }
      });

      // Convert to array and apply filters
      let results: Lead[] = Array.from(employerMap.values()).map(e => ({
        employer_name: e.employer_name,
        employer_website: e.employer_website,
        employer_logo: e.employer_logo,
        job_count: e.job_count,
        job_titles: Array.from(e.job_titles),
        locations: Array.from(e.locations),
        job_country: e.job_country,
        latest_job_posted: e.latest_job_posted,
        recent_jobs_7d: e.recent_jobs_7d,
        recent_jobs_30d: e.recent_jobs_30d,
        matching_titles_count: e.matching_titles.size,
      }));

      // Apply min jobs filter
      if (filters.minJobs > 1) {
        results = results.filter(lead => lead.job_count >= filters.minJobs);
      }

      // Apply has website filter
      if (filters.hasWebsite) {
        results = results.filter(lead => lead.employer_website);
      }

      // Sort by current sort settings
      results = sortLeads(results, sortField, sortOrder);

      setLeads(results);
    } catch (err) {
      console.error('Error searching leads:', err);
      setError(err instanceof Error ? err.message : 'Failed to search leads');
    } finally {
      setLoading(false);
    }
  };

  const sortLeads = (leadsToSort: Lead[], field: SortField, order: SortOrder): Lead[] => {
    return [...leadsToSort].sort((a, b) => {
      let comparison = 0;
      switch (field) {
        case 'job_count':
          comparison = a.job_count - b.job_count;
          break;
        case 'recent_jobs_7d':
          comparison = a.recent_jobs_7d - b.recent_jobs_7d;
          break;
        case 'latest_job_posted':
          const dateA = a.latest_job_posted ? new Date(a.latest_job_posted).getTime() : 0;
          const dateB = b.latest_job_posted ? new Date(b.latest_job_posted).getTime() : 0;
          comparison = dateA - dateB;
          break;
        case 'employer_name':
          comparison = a.employer_name.localeCompare(b.employer_name);
          break;
      }
      return order === 'desc' ? -comparison : comparison;
    });
  };

  const updateSort = (field: SortField) => {
    const newOrder = field === sortField && sortOrder === 'desc' ? 'asc' : 'desc';
    setSortField(field);
    setSortOrder(newOrder);
    setLeads(prev => sortLeads(prev, field, newOrder));
  };

  const exportToCsv = () => {
    if (leads.length === 0) return;

    const headers = ['company_name', 'website', 'job_count', 'jobs_7d', 'jobs_30d', 'job_titles', 'locations', 'country', 'last_posted'];
    const rows = leads.map(lead => [
      `"${lead.employer_name.replace(/"/g, '""')}"`,
      lead.employer_website || '',
      lead.job_count.toString(),
      lead.recent_jobs_7d.toString(),
      lead.recent_jobs_30d.toString(),
      `"${lead.job_titles.join(', ').replace(/"/g, '""')}"`,
      `"${lead.locations.join(', ').replace(/"/g, '""')}"`,
      lead.job_country.toUpperCase(),
      lead.latest_job_posted || '',
    ]);

    const csvContent = [headers.join(','), ...rows.map(row => row.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `leads_export_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return {
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
  };
}
