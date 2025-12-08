import { Job } from '@/types/job';
import { JobCard } from '@/components/JobCard';
import { Briefcase } from 'lucide-react';

interface JobListProps {
  jobs: Job[];
  isFavorite: (jobId: string) => boolean;
  onToggleFavorite: (job: Job) => void;
}

export function JobList({ jobs, isFavorite, onToggleFavorite }: JobListProps) {
  if (jobs.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <Briefcase className="h-16 w-16 text-muted-foreground/50" />
        <h3 className="mt-4 text-lg font-medium text-foreground">No jobs found</h3>
        <p className="mt-1 text-sm text-muted-foreground">
          Try adjusting your search criteria
        </p>
      </div>
    );
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-1">
      {jobs.map((job) => (
        <JobCard
          key={job.job_id}
          job={job}
          isFavorite={isFavorite(job.job_id)}
          onToggleFavorite={onToggleFavorite}
        />
      ))}
    </div>
  );
}
