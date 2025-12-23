import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Building2, ExternalLink, MapPin, ArrowUpDown, ArrowUp, ArrowDown, Flame } from 'lucide-react';
import type { Lead, SortField, SortOrder } from '@/hooks/useLeadSearch';
import { cn } from '@/lib/utils';

interface LeadTableProps {
  leads: Lead[];
  loading: boolean;
  sortField: SortField;
  sortOrder: SortOrder;
  onSort: (field: SortField) => void;
}

function formatDate(dateString: string | null): string {
  if (!dateString) return '-';
  try {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  } catch {
    return dateString;
  }
}

function SortIcon({ field, currentField, order }: { field: SortField; currentField: SortField; order: SortOrder }) {
  if (field !== currentField) {
    return <ArrowUpDown className="h-3 w-3 ml-1 opacity-50" />;
  }
  return order === 'desc' 
    ? <ArrowDown className="h-3 w-3 ml-1" /> 
    : <ArrowUp className="h-3 w-3 ml-1" />;
}

export function LeadTable({ leads, loading, sortField, sortOrder, onSort }: LeadTableProps) {
  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-pulse text-muted-foreground">Searching companies...</div>
      </div>
    );
  }

  if (leads.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        <Building2 className="h-12 w-12 mx-auto mb-4 opacity-50" />
        <p>No companies found. Select a profile and country to find leads.</p>
      </div>
    );
  }

  return (
    <div className="border rounded-lg overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead 
              className="w-[220px] cursor-pointer hover:bg-muted/50"
              onClick={() => onSort('employer_name')}
            >
              <div className="flex items-center">
                Company
                <SortIcon field="employer_name" currentField={sortField} order={sortOrder} />
              </div>
            </TableHead>
            <TableHead>Website</TableHead>
            <TableHead 
              className="text-center cursor-pointer hover:bg-muted/50"
              onClick={() => onSort('job_count')}
            >
              <div className="flex items-center justify-center">
                Jobs
                <SortIcon field="job_count" currentField={sortField} order={sortOrder} />
              </div>
            </TableHead>
            <TableHead 
              className="text-center cursor-pointer hover:bg-muted/50"
              onClick={() => onSort('recent_jobs_7d')}
            >
              <div className="flex items-center justify-center">
                <Flame className="h-3 w-3 mr-1 text-orange-500" />
                7d
                <SortIcon field="recent_jobs_7d" currentField={sortField} order={sortOrder} />
              </div>
            </TableHead>
            <TableHead>Positions</TableHead>
            <TableHead>Locations</TableHead>
            <TableHead 
              className="cursor-pointer hover:bg-muted/50"
              onClick={() => onSort('latest_job_posted')}
            >
              <div className="flex items-center">
                Last Posted
                <SortIcon field="latest_job_posted" currentField={sortField} order={sortOrder} />
              </div>
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {leads.map((lead, index) => (
            <TableRow 
              key={`${lead.employer_name}-${index}`}
              className={cn(lead.recent_jobs_7d > 0 && 'bg-orange-500/5')}
            >
              <TableCell>
                <div className="flex items-center gap-3">
                  {lead.employer_logo ? (
                    <img
                      src={lead.employer_logo}
                      alt={lead.employer_name}
                      className="w-8 h-8 rounded object-contain bg-muted"
                      onError={(e) => {
                        e.currentTarget.style.display = 'none';
                      }}
                    />
                  ) : (
                    <div className="w-8 h-8 rounded bg-muted flex items-center justify-center">
                      <Building2 className="h-4 w-4 text-muted-foreground" />
                    </div>
                  )}
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{lead.employer_name}</span>
                    {lead.recent_jobs_7d > 0 && (
                      <Flame className="h-4 w-4 text-orange-500" />
                    )}
                  </div>
                </div>
              </TableCell>
              <TableCell>
                {lead.employer_website ? (
                  <a
                    href={lead.employer_website.startsWith('http') ? lead.employer_website : `https://${lead.employer_website}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1 text-primary hover:underline text-sm"
                  >
                    {lead.employer_website.replace(/^https?:\/\//, '').replace(/\/$/, '').substring(0, 25)}
                    <ExternalLink className="h-3 w-3" />
                  </a>
                ) : (
                  <span className="text-muted-foreground">-</span>
                )}
              </TableCell>
              <TableCell className="text-center">
                <Badge variant="secondary">{lead.job_count}</Badge>
              </TableCell>
              <TableCell className="text-center">
                {lead.recent_jobs_7d > 0 ? (
                  <Badge variant="default" className="bg-orange-500 hover:bg-orange-600">
                    {lead.recent_jobs_7d}
                  </Badge>
                ) : (
                  <span className="text-muted-foreground text-sm">0</span>
                )}
              </TableCell>
              <TableCell>
                <div className="flex flex-wrap gap-1 max-w-[180px]">
                  {lead.job_titles.slice(0, 2).map((title, i) => (
                    <Badge key={i} variant="outline" className="text-xs truncate max-w-[160px]">
                      {title}
                    </Badge>
                  ))}
                  {lead.job_titles.length > 2 && (
                    <Badge variant="outline" className="text-xs">
                      +{lead.job_titles.length - 2}
                    </Badge>
                  )}
                </div>
              </TableCell>
              <TableCell>
                <div className="flex items-center gap-1 text-sm text-muted-foreground">
                  <MapPin className="h-3 w-3" />
                  <span className="truncate max-w-[120px]">
                    {lead.locations.slice(0, 2).join(', ')}
                    {lead.locations.length > 2 && ` +${lead.locations.length - 2}`}
                  </span>
                </div>
              </TableCell>
              <TableCell className="text-sm text-muted-foreground">
                {formatDate(lead.latest_job_posted)}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
