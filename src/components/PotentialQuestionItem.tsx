import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { AnalysisQuestion } from '@/types/job';
import { Plus, Minus, Quote, Building, TrendingUp } from 'lucide-react';

interface PotentialQuestionItemProps {
  question: AnalysisQuestion;
  onAdd?: () => void;
  onRemove?: () => void;
  threshold: number;
  totalJobs: number;
  showThresholdContext?: boolean;
}

export function PotentialQuestionItem({
  question,
  onAdd,
  onRemove,
  threshold,
  totalJobs,
  showThresholdContext = true
}: PotentialQuestionItemProps) {
  const mentions = question.mentions || 0;
  const percentage = totalJobs > 0 ? (mentions / totalJobs * 100).toFixed(1) : '0';
  const thresholdPercentage = totalJobs > 0 ? (threshold / totalJobs * 100).toFixed(0) : '0';
  const shortfall = threshold - mentions;

  return (
    <div className="p-4 rounded-lg border border-border bg-background">
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          <p className="font-medium text-foreground">{question.question}</p>
          
          {/* Threshold context badges */}
          {showThresholdContext && (
            <>
              <div className="flex flex-wrap items-center gap-2 mt-2 text-xs">
                <Badge variant="secondary" className="gap-1 text-primary-foreground">
                  <TrendingUp className="h-3 w-3" />
                  {mentions} of {totalJobs} jobs ({percentage}%)
                </Badge>
                <Badge variant="outline" className="gap-1 border-amber-400 text-amber-700 dark:text-amber-400">
                  🎯 Threshold: {threshold} ({thresholdPercentage}%)
                </Badge>
              </div>
              
              {/* Explanation why it didn't meet threshold */}
              <p className="text-xs text-amber-600 dark:text-amber-500 mt-2 italic">
                ⚠️ This question needed {shortfall} more mention{shortfall !== 1 ? 's' : ''} to be automatically included.
                Add manually if you believe it's relevant for this profile.
              </p>
            </>
          )}

          {/* Quotes - matching AnalysisCard format */}
          {question.quotes && question.quotes.length > 0 && (
            <div className="space-y-2 mb-3 mt-3">
              <div className="flex items-center gap-1 text-sm font-medium text-foreground">
                <Quote className="h-4 w-4" />
                Quotes
              </div>
              {question.quotes.slice(0, 2).map((quote, i) => (
                <blockquote key={i} className="border-l-2 border-primary/50 pl-3 text-sm italic text-muted-foreground">
                  "{quote}"
                </blockquote>
              ))}
            </div>
          )}

          {/* Sources - matching AnalysisCard format */}
          {question.sources && question.sources.length > 0 && (
            <div className="flex items-center gap-2 flex-wrap mt-2">
              <div className="flex items-center gap-1 text-sm text-muted-foreground">
                <Building className="h-4 w-4" />
                Sources:
              </div>
              {question.sources.map((source, i) => (
                <Badge key={i} variant="secondary" className="text-xs text-primary-foreground">
                  {source}
                </Badge>
              ))}
            </div>
          )}
        </div>
        
        <div className="flex flex-col gap-2 flex-shrink-0">
          {onAdd && (
            <Button size="sm" variant="outline" onClick={onAdd} className="gap-1">
              <Plus className="h-3 w-3" />
              Add
            </Button>
          )}
          {onRemove && (
            <Button size="sm" variant="outline" onClick={onRemove} className="gap-1 text-destructive hover:text-destructive">
              <Minus className="h-3 w-3" />
              Remove
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
