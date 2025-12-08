import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Slider } from '@/components/ui/slider';
import { AnswerType, AnswerOption, ExperienceConfig } from '@/types/job';
import { cn } from '@/lib/utils';

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
          {options.map((option) => {
            const isSelected = selectedValues.includes(option.label);
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
                {option.emoji && <span className="text-xl">{option.emoji}</span>}
                <span className="font-medium">{option.label}</span>
              </button>
            );
          })}
        </div>
      </div>
    );
  }

  if (answerType === 'experience') {
    const config = experienceConfig || { min: 0, max: 10, unit: 'years' as const };
    const currentValue = typeof value === 'number' ? value : config.min;

    return (
      <div className="mt-3 space-y-4">
        <div className="flex items-center justify-between">
          <span className="text-sm text-muted-foreground">Experience</span>
          <span className="text-lg font-semibold">
            {currentValue} {config.unit}
          </span>
        </div>
        <Slider
          value={[currentValue]}
          min={config.min}
          max={config.max}
          step={1}
          onValueChange={([val]) => onChange(val)}
          className="w-full"
        />
        <div className="flex justify-between text-xs text-muted-foreground">
          <span>{config.min} {config.unit}</span>
          <span>{config.max}+ {config.unit}</span>
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
