import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { AnalysisQuestion } from '@/types/job';
import { QuestionAnswer } from '@/components/QuestionAnswer';
import { FileText, Quote, Building, TrendingUp } from 'lucide-react';
import { cn } from '@/lib/utils';

interface AnalysisCardProps {
  title: string;
  icon: React.ReactNode;
  questions: AnalysisQuestion[];
  color: string;
  onAnswerChange?: (index: number, answer: string | string[] | number | boolean) => void;
}

export function AnalysisCard({ title, icon, questions, color, onAnswerChange }: AnalysisCardProps) {
  const getCertaintyColor = (certainty: string) => {
    switch (certainty) {
      case 'high':
        return 'bg-green-500/10 text-green-700 border-green-500/20';
      case 'medium':
        return 'bg-yellow-500/10 text-yellow-700 border-yellow-500/20';
      case 'low':
        return 'bg-red-500/10 text-red-700 border-red-500/20';
      default:
        return 'bg-muted text-muted-foreground';
    }
  };

  if (!questions || questions.length === 0) {
    return (
      <Card>
        <CardHeader className={cn('border-b', color)}>
          <CardTitle className="flex items-center gap-2 text-lg">
            {icon}
            {title}
          </CardTitle>
        </CardHeader>
        <CardContent className="py-8 text-center text-muted-foreground">
          <p>No specific requirements found in this category</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className={cn('border-b', color)}>
        <CardTitle className="flex items-center gap-2 text-lg">
          {icon}
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent className="divide-y divide-border">
        {questions.map((q, index) => (
          <div key={index} className="py-4 first:pt-4 last:pb-4">
            <div className="flex items-start justify-between gap-4 mb-3">
              <h4 className="font-medium text-foreground">{q.question}</h4>
              <Badge
                variant="outline"
                className={cn('shrink-0', getCertaintyColor(q.certainty))}
              >
                {q.certainty}
              </Badge>
            </div>

            {/* Answer Input */}
            {q.answerType && (
              <QuestionAnswer
                answerType={q.answerType}
                options={q.options}
                experienceConfig={q.experienceConfig}
                value={q.userAnswer}
                onChange={(val) => onAnswerChange?.(index, val)}
              />
            )}

            <div className="flex items-center gap-4 text-sm text-muted-foreground mb-3 mt-3">
              <span className="flex items-center gap-1">
                <TrendingUp className="h-4 w-4" />
                Mentioned in {q.mentions} jobs
              </span>
            </div>

            {q.quotes && q.quotes.length > 0 && (
              <div className="space-y-2 mb-3">
                <div className="flex items-center gap-1 text-sm font-medium text-foreground">
                  <Quote className="h-4 w-4" />
                  Quotes
                </div>
                {q.quotes.slice(0, 2).map((quote, i) => (
                  <blockquote
                    key={i}
                    className="border-l-2 border-primary/50 pl-3 text-sm italic text-muted-foreground"
                  >
                    "{quote}"
                  </blockquote>
                ))}
              </div>
            )}

            {q.sources && q.sources.length > 0 && (
              <div className="flex items-center gap-2 flex-wrap">
                <div className="flex items-center gap-1 text-sm text-muted-foreground">
                  <Building className="h-4 w-4" />
                  Sources:
                </div>
                {q.sources.map((source, i) => (
                  <Badge key={i} variant="secondary" className="text-xs text-secondary-foreground">
                    {source}
                  </Badge>
                ))}
              </div>
            )}
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
