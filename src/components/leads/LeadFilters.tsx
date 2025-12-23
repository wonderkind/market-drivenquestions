import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Search, Loader2 } from 'lucide-react';
import type { ProfileOption, LeadFilters as LeadFiltersType } from '@/hooks/useLeadSearch';

interface LeadFiltersProps {
  profiles: ProfileOption[];
  profilesLoading: boolean;
  filters: LeadFiltersType;
  onFiltersChange: (filters: LeadFiltersType) => void;
  onSearch: () => void;
  loading: boolean;
}

const COUNTRIES = [
  { value: 'all', label: 'All Countries' },
  { value: 'NL', label: 'Netherlands' },
  { value: 'US', label: 'United States' },
  { value: 'DE', label: 'Germany' },
  { value: 'GB', label: 'United Kingdom' },
  { value: 'FR', label: 'France' },
];

const MIN_JOBS_OPTIONS = [
  { value: '1', label: '1+' },
  { value: '2', label: '2+' },
  { value: '3', label: '3+' },
  { value: '5', label: '5+' },
  { value: '10', label: '10+' },
];

const DAYS_POSTED_OPTIONS = [
  { value: 'all', label: 'All Time' },
  { value: '7', label: 'Last 7 days' },
  { value: '14', label: 'Last 14 days' },
  { value: '30', label: 'Last 30 days' },
  { value: '90', label: 'Last 90 days' },
];

export function LeadFilters({
  profiles,
  profilesLoading,
  filters,
  onFiltersChange,
  onSearch,
  loading,
}: LeadFiltersProps) {
  const updateFilter = <K extends keyof LeadFiltersType>(key: K, value: LeadFiltersType[K]) => {
    onFiltersChange({ ...filters, [key]: value });
  };

  return (
    <div className="space-y-6">
      {/* Profile Selector */}
      <div className="space-y-2">
        <Label htmlFor="profile-select">Select Candidate Segment</Label>
        <Select
          value={filters.profileId}
          onValueChange={(value) => updateFilter('profileId', value)}
          disabled={profilesLoading}
        >
          <SelectTrigger id="profile-select" className="w-full">
            <SelectValue placeholder={profilesLoading ? 'Loading profiles...' : 'Select a profile'} />
          </SelectTrigger>
          <SelectContent>
            {profiles.map((profile) => (
              <SelectItem key={profile.id} value={profile.id}>
                {profile.name} ({profile.country.toUpperCase()})
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Filter Row */}
      <div className="flex flex-wrap gap-4 items-end">
        <div className="space-y-2">
          <Label htmlFor="country-select">Country</Label>
          <Select
            value={filters.country}
            onValueChange={(value) => updateFilter('country', value)}
          >
            <SelectTrigger id="country-select" className="w-[160px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {COUNTRIES.map((country) => (
                <SelectItem key={country.value} value={country.value}>
                  {country.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="min-jobs-select">Min Jobs</Label>
          <Select
            value={filters.minJobs.toString()}
            onValueChange={(value) => updateFilter('minJobs', parseInt(value))}
          >
            <SelectTrigger id="min-jobs-select" className="w-[100px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {MIN_JOBS_OPTIONS.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="days-posted-select">Posted Within</Label>
          <Select
            value={filters.daysPosted?.toString() || 'all'}
            onValueChange={(value) => updateFilter('daysPosted', value === 'all' ? null : parseInt(value))}
          >
            <SelectTrigger id="days-posted-select" className="w-[140px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {DAYS_POSTED_OPTIONS.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-center space-x-2 pb-2">
          <Checkbox
            id="has-website"
            checked={filters.hasWebsite}
            onCheckedChange={(checked) => updateFilter('hasWebsite', checked === true)}
          />
          <Label htmlFor="has-website" className="cursor-pointer">
            Has Website
          </Label>
        </div>

        <Button
          onClick={onSearch}
          disabled={!filters.profileId || loading}
          className="gap-2"
        >
          {loading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Search className="h-4 w-4" />
          )}
          Find Companies
        </Button>
      </div>
    </div>
  );
}
