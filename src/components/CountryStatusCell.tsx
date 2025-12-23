import { MessageSquare, Briefcase, Plus, MoreHorizontal, Eye, RefreshCw, Trash2 } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';

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
  onRegenerate?: () => void;
  onDelete?: () => void;
}

export function CountryStatusCell({ analysis, onClick, onRegenerate, onDelete }: CountryStatusCellProps) {
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
    <div className="w-full py-2 px-3 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-between gap-2">
      <button
        onClick={onClick}
        className="flex-1 flex items-center justify-center gap-3 text-sm hover:opacity-80 transition-opacity"
      >
        <span className="flex items-center gap-1 text-primary font-medium">
          <MessageSquare className="h-3.5 w-3.5" />
          {analysis.questionsCount || 0}
        </span>
        <span className="text-border">|</span>
        <span className="flex items-center gap-1 text-muted-foreground">
          <Briefcase className="h-3.5 w-3.5" />
          {analysis.jobsCount || 0}
        </span>
      </button>
      
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6 shrink-0"
            onClick={(e) => e.stopPropagation()}
          >
            <MoreHorizontal className="h-3.5 w-3.5" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-40">
          <DropdownMenuItem onClick={onClick}>
            <Eye className="h-4 w-4 mr-2" />
            View
          </DropdownMenuItem>
          {onRegenerate && (
            <DropdownMenuItem onClick={onRegenerate}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Regenerate
            </DropdownMenuItem>
          )}
          {onDelete && (
            <>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={onDelete}
                className="text-destructive focus:text-destructive"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Delete
              </DropdownMenuItem>
            </>
          )}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}