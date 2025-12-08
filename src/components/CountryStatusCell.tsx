import { Badge } from '@/components/ui/badge';
import { MessageSquare, Briefcase } from 'lucide-react';

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
        className="w-full py-2 px-3 text-center rounded-md border border-dashed border-muted-foreground/30 text-muted-foreground hover:border-primary hover:text-primary hover:bg-primary/5 transition-colors text-sm"
      >
        Not Created
      </button>
    );
  }

  return (
    <button
      onClick={onClick}
      className="w-full py-2 px-3 rounded-md bg-primary/10 hover:bg-primary/20 transition-colors"
    >
      <Badge variant="secondary" className="w-full justify-center gap-2 py-1">
        <span className="flex items-center gap-1">
          <MessageSquare className="h-3 w-3" />
          {analysis.questionsCount || 0}
        </span>
        <span className="text-muted-foreground">/</span>
        <span className="flex items-center gap-1">
          <Briefcase className="h-3 w-3" />
          {analysis.jobsCount || 0}
        </span>
      </Badge>
    </button>
  );
}
