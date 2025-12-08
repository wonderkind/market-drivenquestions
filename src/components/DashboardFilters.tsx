import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Search } from 'lucide-react';

interface DashboardFiltersProps {
  searchQuery: string;
  onSearchChange: (value: string) => void;
  statusFilter: 'all' | 'analysed' | 'not_created';
  onStatusFilterChange: (value: 'all' | 'analysed' | 'not_created') => void;
  countryFilter: string;
  onCountryFilterChange: (value: string) => void;
}

export const SUPPORTED_COUNTRIES = [
  { code: 'nl', label: 'Netherlands', flag: '🇳🇱' },
  { code: 'de', label: 'Germany', flag: '🇩🇪' },
  { code: 'us', label: 'United States', flag: '🇺🇸' },
  { code: 'gb', label: 'United Kingdom', flag: '🇬🇧' },
];

export function DashboardFilters({
  searchQuery,
  onSearchChange,
  statusFilter,
  onStatusFilterChange,
  countryFilter,
  onCountryFilterChange,
}: DashboardFiltersProps) {
  return (
    <div className="flex flex-col sm:flex-row gap-4 mb-6">
      <div className="relative flex-1">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search profiles..."
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          className="pl-10"
        />
      </div>
      
      <Select value={statusFilter} onValueChange={onStatusFilterChange}>
        <SelectTrigger className="w-full sm:w-[180px]">
          <SelectValue placeholder="Status" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Statuses</SelectItem>
          <SelectItem value="analysed">Analysed Only</SelectItem>
          <SelectItem value="not_created">Not Created Only</SelectItem>
        </SelectContent>
      </Select>

      <Select value={countryFilter} onValueChange={onCountryFilterChange}>
        <SelectTrigger className="w-full sm:w-[180px]">
          <SelectValue placeholder="Country" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Countries</SelectItem>
          {SUPPORTED_COUNTRIES.map((country) => (
            <SelectItem key={country.code} value={country.code}>
              {country.flag} {country.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
