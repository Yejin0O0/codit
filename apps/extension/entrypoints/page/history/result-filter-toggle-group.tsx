import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';

import { RESULT_FILTER_LABELS, type ResultFilter } from './types';

interface ResultFilterToggleGroupProps {
    value: ResultFilter;
    onChange: (next: ResultFilter) => void;
}

const OPTIONS: ResultFilter[] = ['ALL', 'CORRECT', 'WRONG', 'HOLD'];

export function ResultFilterToggleGroup({ value, onChange }: ResultFilterToggleGroupProps) {
    return (
        <ToggleGroup
            type="single"
            variant="outline"
            value={value}
            onValueChange={(next) => {
                // 현재 선택 항목 재클릭 시 Radix 는 '' 를 보낸다 — 필터를 해제하지 않는다.
                if (next) {
                    onChange(next as ResultFilter);
                }
            }}
            className="w-full"
        >
            {OPTIONS.map((option) => (
                <ToggleGroupItem key={option} value={option} className="flex-1 text-sm font-medium">
                    {RESULT_FILTER_LABELS[option]}
                </ToggleGroupItem>
            ))}
        </ToggleGroup>
    );
}
