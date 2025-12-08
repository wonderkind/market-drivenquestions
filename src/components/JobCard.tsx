import { useState } from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import {
  Building,
  MapPin,
  Clock,
  ExternalLink,
  Heart,
  ChevronDown,
  ChevronUp,
  Briefcase,
} from 'lucide-react';
import { Job } from '@/types/job';
import { cn } from '@/lib/utils';

interface JobCardProps {
  job: Job;
  isFavorite: boolean;
  onToggleFavorite: (job: Job) => void;
}

export function JobCard({ job, isFavorite, onToggleFavorite }: JobCardProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <Card className="overflow-hidden transition-shadow hover:shadow-md">
      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-start gap-3">
              {job.employer_logo ? (
                <img
                  src={job.employer_logo}
                  alt={job.employer_name}
                  className="h-12 w-12 rounded-lg object-contain bg-muted p-1"
                />
              ) : (
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-muted">
                  <Building className="h-6 w-6 text-muted-foreground" />
                </div>
              )}
              <div className="space-y-1">
                <h3 className="font-semibold text-foreground leading-tight">
                  {job.job_title}
                </h3>
                <p className="text-sm text-muted-foreground">{job.employer_name}</p>
              </div>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => onToggleFavorite(job)}
              className={cn(
                'shrink-0',
                isFavorite && 'text-red-500 hover:text-red-600'
              )}
            >
              <Heart className={cn('h-5 w-5', isFavorite && 'fill-current')} />
            </Button>
          </div>
        </CardHeader>

        <CardContent className="space-y-3">
          <div className="flex flex-wrap gap-2 text-sm text-muted-foreground">
            <span className="flex items-center gap-1">
              <MapPin className="h-4 w-4" />
              {job.job_location}
            </span>
            {job.job_employment_type && (
              <span className="flex items-center gap-1">
                <Briefcase className="h-4 w-4" />
                {job.job_employment_type}
              </span>
            )}
            {job.job_posted_at && (
              <span className="flex items-center gap-1">
                <Clock className="h-4 w-4" />
                {job.job_posted_at}
              </span>
            )}
          </div>

          {job.job_is_remote && (
            <Badge variant="secondary">Remote</Badge>
          )}

          <p className="text-sm text-muted-foreground line-clamp-2">
            {job.job_description?.slice(0, 200)}...
          </p>

          <CollapsibleTrigger asChild>
            <Button variant="ghost" size="sm" className="w-full gap-2">
              {isOpen ? (
                <>
                  <ChevronUp className="h-4 w-4" />
                  Show Less
                </>
              ) : (
                <>
                  <ChevronDown className="h-4 w-4" />
                  Show More
                </>
              )}
            </Button>
          </CollapsibleTrigger>

          <CollapsibleContent className="space-y-4">
            <div className="rounded-lg bg-muted/50 p-4">
              <h4 className="mb-2 font-medium text-foreground">Job Description</h4>
              <p className="whitespace-pre-wrap text-sm text-muted-foreground">
                {job.job_description}
              </p>
            </div>

            {job.apply_options && job.apply_options.length > 0 && (
              <div className="space-y-2">
                <h4 className="font-medium text-foreground">Apply Options</h4>
                <div className="flex flex-wrap gap-2">
                  {job.apply_options.slice(0, 5).map((option, index) => (
                    <Button
                      key={index}
                      variant="outline"
                      size="sm"
                      asChild
                      className="gap-2"
                    >
                      <a
                        href={option.apply_link}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        {option.publisher}
                        <ExternalLink className="h-3 w-3" />
                      </a>
                    </Button>
                  ))}
                </div>
              </div>
            )}

            <Button asChild className="w-full gap-2">
              <a
                href={job.job_apply_link}
                target="_blank"
                rel="noopener noreferrer"
              >
                <ExternalLink className="h-4 w-4" />
                Apply Now
              </a>
            </Button>
          </CollapsibleContent>
        </CardContent>
      </Collapsible>
    </Card>
  );
}
