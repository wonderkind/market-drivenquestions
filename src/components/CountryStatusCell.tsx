import { Badge } from '@/components/ui/badge';
import { MessageSquare, Briefcase, Plus } from 'lucide-react';

interface CountryAnalysis {
  status: 'not_created' | 'analysed';
  analysisId?: string;
  questionsCount?: number;
  jobsCount?: number;
  language?: string;
}

interface CountryStatusCellProps {
  analysis: CountryAnalysis | undefined;
  onClick: () => void;
}

export function CountryStatusCell({ analysis, onClick }: CountryStatusCellProps) {
  if (!analysis || analysis.status === 'not_created') {
    return (
      <button
        onClick={onClick}
        className="w-full py-2.5 px-3 text-center rounded-lg border border-dashed border-border text-muted-foreground hover:border-primary hover:text-primary hover:bg-primary/5 transition-all duration-200 text-sm flex items-center justify-center gap-1.5 group"
      >
        <Plus className="h-3.5 w-3.5 opacity-0 group-hover:opacity-100 transition-opacity" />
        <span>Create</span>
      </button>
    );
  }

  return (
    <button
      onClick={onClick}
      className="w-full py-2 px-3 rounded-lg bg-primary/10 hover:bg-primary/20 border border-primary/20 hover:border-primary/30 transition-all duration-200"
    >
      <div className="flex items-center justify-center gap-3 text-sm">
        <span className="flex items-center gap-1 text-primary font-medium">
          <MessageSquare className="h-3.5 w-3.5" />
          {analysis.questionsCount || 0}
        </span>
        <span className="text-border">|</span>
        <span className="flex items-center gap-1 text-muted-foreground">
          <Briefcase className="h-3.5 w-3.5" />
          {analysis.jobsCount || 0}
        </span>
      </div>
    </button>
  );
}