import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';

import type { ResultType } from '../screens';

interface MemoFieldProps {
    result: ResultType;
    value: string;
    onChange: (value: string) => void;
    /** CORRECT 에서 "메모 추가하기" 확장 여부 */
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

const PLACEHOLDER = '풀이 접근, 막힌 지점, 다시 볼 점을 적어두세요.';

/**
 * 결과값에 따라 메모 입력 동작이 달라진다.
 * - WRONG  : Textarea 자동 노출 (선택 입력)
 * - CORRECT: 기본 접힘, "메모 추가하기" 클릭 시 노출
 * - HOLD   : 렌더하지 않음
 */
export function MemoField({ result, value, onChange, open, onOpenChange }: MemoFieldProps) {
    if (result === 'HOLD') {
        return null;
    }

    const textarea = (
        <Textarea
            value={value}
            onChange={(event) => onChange(event.target.value)}
            placeholder={PLACEHOLDER}
            rows={4}
            className="resize-none"
        />
    );

    if (result === 'WRONG') {
        return (
            <div className="flex flex-col gap-1.5">
                <Label>메모</Label>
                {textarea}
            </div>
        );
    }

    return (
        <Collapsible open={open} onOpenChange={onOpenChange} className="flex flex-col gap-1.5">
            <CollapsibleTrigger className="text-muted-foreground hover:text-foreground w-fit text-xs font-medium underline-offset-2 hover:underline">
                {open ? '메모 접기' : '메모 추가하기'}
            </CollapsibleTrigger>
            <CollapsibleContent>{textarea}</CollapsibleContent>
        </Collapsible>
    );
}
