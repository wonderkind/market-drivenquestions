import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { AnswerType, AnswerOption, ExperienceConfig } from '@/types/job';
import { cn } from '@/lib/utils';

// Default emojis for options without specific emoji
const defaultEmojis = ['📌', '✨', '💡', '🔹', '⭐', '📎', '🔸', '💠'];

// Experience options (predefined)
const experienceOptions = [
  { value: 0, label: 'No experience', emoji: '0️⃣' },
  { value: 1, label: 'Less than 1 year', emoji: '1️⃣' },
  { value: 2, label: '1-3 years', emoji: '2️⃣' },
  { value: 3, label: '3-5 years', emoji: '3️⃣' },
  { value: 5, label: '5+ years', emoji: '5️⃣' },
];

interface QuestionAnswerProps {
  answerType: AnswerType;
  options?: AnswerOption[];
  experienceConfig?: ExperienceConfig;
  value?: string | string[] | number | boolean;
  onChange: (value: string | string[] | number | boolean) => void;
}

export function QuestionAnswer({
  answerType,
  options = [],
  experienceConfig,
  value,
  onChange,
}: QuestionAnswerProps) {
  if (answerType === 'yes_no') {
    return (
      <div className="flex gap-3 mt-3">
        <Button
          type="button"
          variant={value === true ? 'default' : 'outline'}
          className={cn(
            'flex-1 h-12 text-base font-medium',
            value === true && 'ring-2 ring-primary ring-offset-2'
          )}
          onClick={() => onChange(true)}
        >
          ✅ Yes
        </Button>
        <Button
          type="button"
          variant={value === false ? 'default' : 'outline'}
          className={cn(
            'flex-1 h-12 text-base font-medium',
            value === false && 'ring-2 ring-primary ring-offset-2'
          )}
          onClick={() => onChange(false)}
        >
          ❌ No
        </Button>
      </div>
    );
  }

  if (answerType === 'multiple_choice') {
    const selectedValues = Array.isArray(value) ? value : [];

    const toggleOption = (label: string) => {
      if (selectedValues.includes(label)) {
        onChange(selectedValues.filter((v) => v !== label));
      } else {
        onChange([...selectedValues, label]);
      }
    };

    return (
      <div className="mt-3 space-y-2">
        <p className="text-sm text-muted-foreground mb-2">Select all that apply</p>
        <div className="grid gap-2">
          {options.map((option, index) => {
            const isSelected = selectedValues.includes(option.label);
            const emoji = option.emoji || defaultEmojis[index % defaultEmojis.length];
            return (
              <button
                key={option.label}
                type="button"
                className={cn(
                  'flex items-center gap-3 p-4 rounded-xl border-2 transition-all text-left',
                  isSelected
                    ? 'border-primary bg-primary/10'
                    : 'border-border hover:border-primary/50 hover:bg-muted/50'
                )}
                onClick={() => toggleOption(option.label)}
              >
                <Checkbox checked={isSelected} className="pointer-events-none" />
                <span className="text-xl">{emoji}</span>
                <span className="font-medium">{option.label}</span>
              </button>
            );
          })}
        </div>
      </div>
    );
  }

  if (answerType === 'experience') {
    const currentValue = typeof value === 'number' ? value : null;

    return (
      <div className="mt-3 space-y-2">
        <div className="grid gap-2">
          {experienceOptions.map((option) => {
            const isSelected = currentValue === option.value;
            return (
              <button
                key={option.value}
                type="button"
                className={cn(
                  'flex items-center gap-3 p-4 rounded-xl border-2 transition-all text-left',
                  isSelected
                    ? 'border-primary bg-primary/10'
                    : 'border-border hover:border-primary/50 hover:bg-muted/50'
                )}
                onClick={() => onChange(option.value)}
              >
                <span className="text-xl">{option.emoji}</span>
                <span className="font-medium">{option.label}</span>
              </button>
            );
          })}
        </div>
      </div>
    );
  }

  // Default: text input
  return (
    <div className="mt-3">
      <Input
        type="text"
        value={typeof value === 'string' ? value : ''}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Type your answer..."
        className="h-12"
      />
    </div>
  );
}
