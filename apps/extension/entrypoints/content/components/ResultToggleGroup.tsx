import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { cn } from '@/lib/utils';

import { RESULT_OPTIONS, type ResultType } from '../screens';

interface ResultToggleGroupProps {
    value: ResultType | null;
    onChange: (value: ResultType) => void;
}

const TONE_CLASS: Record<ResultType, string> = {
    CORRECT:
        'data-[state=on]:border-success data-[state=on]:bg-success data-[state=on]:text-success-foreground',
    WRONG: 'data-[state=on]:border-destructive data-[state=on]:bg-destructive data-[state=on]:text-white',
    HOLD: 'data-[state=on]:border-warning data-[state=on]:bg-warning data-[state=on]:text-warning-foreground',
};

/**
 * 정답 / 오답 / 보류 단일 선택 (EXTEND ← ui/toggle-group, single).
 * 선택 시 의미 토큰(success / destructive / warning) 색을 입힌다.
 */
export function ResultToggleGroup({ value, onChange }: ResultToggleGroupProps) {
    return (
        <ToggleGroup
            type="single"
            variant="outline"
            value={value ?? ''}
            onValueChange={(next) => {
                if (next) {
                    onChange(next as ResultType);
                }
            }}
            className="w-full"
        >
            {RESULT_OPTIONS.map((option) => (
                <ToggleGroupItem
                    key={option.value}
                    value={option.value}
                    className={cn('flex-1 text-sm font-medium', TONE_CLASS[option.value])}
                >
                    {option.label}
                </ToggleGroupItem>
            ))}
        </ToggleGroup>
    );
}
