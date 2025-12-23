import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { AnalysisQuestion } from '@/types/job';
import { QuestionAnswer } from '@/components/QuestionAnswer';
import { Quote, Building, TrendingUp, Minus, Star, AlertTriangle, Scale } from 'lucide-react';
import { cn } from '@/lib/utils';

interface AnalysisCardProps {
  title: string;
  icon: React.ReactNode;
  questions: AnalysisQuestion[];
  color: string;
  onAnswerChange?: (index: number, answer: string | string[] | number | boolean) => void;
  onRemove?: (index: number) => void;
}

function ScoringBadges({ question }: { question: AnalysisQuestion }) {
  const { scoring, answerType, options, experienceConfig } = question;
  
  if (!scoring) return null;
  
  return (
    <div className="flex flex-wrap items-center gap-2 mt-2 mb-3 text-xs">
      {/* Required indicator */}
      {scoring.isRequired && (
        <Badge variant="destructive" className="gap-1">
          <AlertTriangle className="h-3 w-3" />
          Required
        </Badge>
      )}
      
      {/* Weight indicator */}
      {scoring.weight && (
        <Badge variant="outline" className="gap-1">
          <Scale className="h-3 w-3" />
          Weight: {scoring.weight}/10
        </Badge>
      )}
      
      {/* Yes/No scoring */}
      {answerType === 'yes_no' && scoring.yesNoScoring && (
        <Badge variant="secondary" className="gap-1 text-primary-foreground">
          <Star className="h-3 w-3" />
          Yes: {scoring.yesNoScoring.yesScore}% | No: {scoring.yesNoScoring.noScore}%
        </Badge>
      )}
      
      {/* Multiple choice - show preferred answers */}
      {answerType === 'multiple_choice' && options && options.some(o => o.isPreferred) && (
        <Badge variant="secondary" className="gap-1 text-primary-foreground">
          <Star className="h-3 w-3" />
          Preferred: {options.filter(o => o.isPreferred).map(o => o.label).join(', ')}
        </Badge>
      )}
      
      {/* Experience tiers preview */}
      {answerType === 'experience' && experienceConfig?.scoringTiers && (
        <Badge variant="secondary" className="gap-1 text-primary-foreground">
          <Star className="h-3 w-3" />
          {experienceConfig.scoringTiers.length} scoring tiers
        </Badge>
      )}
    </div>
  );
}

function OptionScores({ question }: { question: AnalysisQuestion }) {
  const { answerType, options, experienceConfig } = question;
  
  if (answerType === 'multiple_choice' && options && options.some(o => o.score !== undefined)) {
    return (
      <div className="mt-2 p-2 bg-muted/30 rounded text-xs">
        <p className="font-medium mb-1 text-muted-foreground">Score per option:</p>
        <div className="flex flex-wrap gap-2">
          {options.map((opt, i) => (
            <span key={i} className={cn(
              "inline-flex items-center gap-1 px-2 py-0.5 rounded",
              opt.isPreferred ? "bg-primary/10 text-primary" : "bg-muted"
            )}>
              {opt.isPreferred && <Star className="h-3 w-3" />}
              {opt.emoji} {opt.label}: {opt.score ?? 0}%
            </span>
          ))}
        </div>
      </div>
    );
  }
  
  if (answerType === 'experience' && experienceConfig?.scoringTiers) {
    return (
      <div className="mt-2 p-2 bg-muted/30 rounded text-xs">
        <p className="font-medium mb-1 text-muted-foreground">Experience scoring:</p>
        <div className="flex flex-wrap gap-2">
          {experienceConfig.scoringTiers.map((tier, i) => (
            <span key={i} className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-muted">
              {tier.minValue}-{tier.maxValue} {experienceConfig.unit}: {tier.score}%
              {tier.label && <span className="text-muted-foreground">({tier.label})</span>}
            </span>
          ))}
        </div>
      </div>
    );
  }
  
  return null;
}

export function AnalysisCard({
  title,
  icon,
  questions,
  color,
  onAnswerChange,
  onRemove
}: AnalysisCardProps) {
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
      <CardContent className="p-4 space-y-4">
        {questions.map((q, index) => (
          <div key={index} className="bg-muted/50 rounded-lg p-4 border border-border/50">
            <div className="flex items-start justify-between gap-4 mb-3">
              <h4 className="font-medium text-foreground">{q.question}</h4>
              <div className="flex items-center gap-2 shrink-0">
                <Badge variant="outline" className={cn(getCertaintyColor(q.certainty))}>
                  {q.certainty}
                </Badge>
                {onRemove && (
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-7 w-7 text-amber-600 hover:text-amber-700 hover:bg-amber-100"
                    onClick={() => onRemove(index)}
                    title="Move to potential questions"
                  >
                    <Minus className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </div>

            {/* Scoring badges */}
            <ScoringBadges question={q} />
            
            {/* Option/Experience scores detail */}
            <OptionScores question={q} />

            {/* Answer Input */}
            {q.answerType && (
              <QuestionAnswer 
                answerType={q.answerType} 
                options={q.options} 
                experienceConfig={q.experienceConfig} 
                value={q.userAnswer} 
                onChange={val => onAnswerChange?.(index, val)} 
              />
            )}

            <div className="flex items-center gap-4 text-sm text-muted-foreground mb-3 mt-3">
              <span className="flex items-center gap-1 text-lg text-secondary">
                <TrendingUp className="h-4 w-4" />
                Mentioned in {q.mentions} jobs
              </span>
            </div>

            {q.quotes && q.quotes.length > 0 && (
              <div className="space-y-2 mb-3">
                <div className="flex items-center gap-1 text-sm font-medium text-foreground border-2 border-primary-foreground">
                  <Quote className="h-4 w-4" />
                  Quotes
                </div>
                {q.quotes.slice(0, 2).map((quote, i) => (
                  <blockquote key={i} className="border-l-2 border-primary/50 pl-3 text-sm italic text-muted-foreground">
                    "{quote}"
                  </blockquote>
                ))}
              </div>
            )}

            {q.sources && q.sources.length > 0 && (
              <div className="flex items-center gap-2 flex-wrap">
                <div className="flex items-center gap-1 text-sm text-muted-foreground border-2">
                  <Building className="h-4 w-4" />
                  Sources:
                </div>
                {q.sources.map((source, i) => (
                  <Badge key={i} variant="secondary" className="text-xs text-primary-foreground">
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