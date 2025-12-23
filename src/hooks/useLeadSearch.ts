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

export function useLeadSearch() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [profiles, setProfiles] = useState<ProfileOption[]>([]);
  const [profilesLoading, setProfilesLoading] = useState(false);

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
        translations?: { job_title?: string }[];
      };

      // Build search terms from profile name and translations
      const searchTerms: string[] = [];
      if (analysisData?.profile) {
        // Split profile name into keywords
        const keywords = analysisData.profile.split(/[\s,]+/).filter(w => w.length > 3);
        searchTerms.push(...keywords.slice(0, 3)); // Take first 3 significant words
      }
      if (analysisData?.translations) {
        analysisData.translations.forEach(t => {
          if (t.job_title) searchTerms.push(t.job_title);
        });
      }

      // Query jobs table
      let query = supabase
        .from('jobs')
        .select('employer_name, employer_website, employer_logo, job_title, job_location, job_country, job_posted_at')
        .not('employer_name', 'is', null);

      if (filters.country && filters.country !== 'all') {
        query = query.eq('job_country', filters.country);
      }

      if (filters.daysPosted) {
        const cutoffDate = new Date();
        cutoffDate.setDate(cutoffDate.getDate() - filters.daysPosted);
        query = query.gte('created_at', cutoffDate.toISOString());
      }

      const { data: jobsData, error: jobsError } = await query;

      if (jobsError) throw jobsError;

      // Aggregate by employer
      const employerMap = new Map<string, {
        employer_name: string;
        employer_website: string | null;
        employer_logo: string | null;
        job_titles: Set<string>;
        locations: Set<string>;
        job_country: string;
        latest_job_posted: string | null;
        job_count: number;
      }>();

      (jobsData || []).forEach(job => {
        if (!job.employer_name) return;

        const key = job.employer_name.toLowerCase().trim();
        
        if (!employerMap.has(key)) {
          employerMap.set(key, {
            employer_name: job.employer_name,
            employer_website: job.employer_website,
            employer_logo: job.employer_logo,
            job_titles: new Set(),
            locations: new Set(),
            job_country: job.job_country || '',
            latest_job_posted: job.job_posted_at,
            job_count: 0,
          });
        }

        const employer = employerMap.get(key)!;
        employer.job_count++;
        if (job.job_title) employer.job_titles.add(job.job_title);
        if (job.job_location) employer.locations.add(job.job_location);
        if (job.job_posted_at && (!employer.latest_job_posted || job.job_posted_at > employer.latest_job_posted)) {
          employer.latest_job_posted = job.job_posted_at;
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
      }));

      // Apply min jobs filter
      if (filters.minJobs > 1) {
        results = results.filter(lead => lead.job_count >= filters.minJobs);
      }

      // Apply has website filter
      if (filters.hasWebsite) {
        results = results.filter(lead => lead.employer_website);
      }

      // Sort by job count descending
      results.sort((a, b) => b.job_count - a.job_count);

      setLeads(results);
    } catch (err) {
      console.error('Error searching leads:', err);
      setError(err instanceof Error ? err.message : 'Failed to search leads');
    } finally {
      setLoading(false);
    }
  };

  const exportToCsv = () => {
    if (leads.length === 0) return;

    const headers = ['company_name', 'website', 'job_count', 'job_titles', 'locations', 'country', 'last_posted'];
    const rows = leads.map(lead => [
      `"${lead.employer_name.replace(/"/g, '""')}"`,
      lead.employer_website || '',
      lead.job_count.toString(),
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
  };
}
