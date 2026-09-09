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

const DEFAULT_PLACEHOLDER = '풀이 접근, 막힌 지점, 다시 볼 점을 적어두세요.';
const AUTO_SHOW_PLACEHOLDER: Record<'WRONG' | 'HOLD', string> = {
    WRONG: DEFAULT_PLACEHOLDER,
    HOLD: '보류한 이유를 적어두세요.',
};

/**
 * 결과값에 따라 메모 입력 동작이 달라진다.
 * - WRONG / HOLD: Textarea 자동 노출 (선택 입력, placeholder 는 결과별로 다름)
 * - CORRECT     : 기본 접힘, "메모 추가하기" 클릭 시 노출
 */
export function MemoField({ result, value, onChange, open, onOpenChange }: MemoFieldProps) {
    if (result === 'WRONG' || result === 'HOLD') {
        return (
            <div className="flex flex-col gap-1.5">
                <Label>메모</Label>
                <Textarea
                    value={value}
                    onChange={(event) => onChange(event.target.value)}
                    placeholder={AUTO_SHOW_PLACEHOLDER[result]}
                    rows={4}
                    className="resize-none"
                />
            </div>
        );
    }

    const textarea = (
        <Textarea
            value={value}
            onChange={(event) => onChange(event.target.value)}
            placeholder={DEFAULT_PLACEHOLDER}
            rows={4}
            className="resize-none"
        />
    );

    return (
        <Collapsible open={open} onOpenChange={onOpenChange} className="flex flex-col gap-1.5">
            <CollapsibleTrigger className="text-muted-foreground hover:text-foreground w-fit text-xs font-medium underline-offset-2 hover:underline">
                {open ? '메모 접기' : '메모 추가하기'}
            </CollapsibleTrigger>
            <CollapsibleContent>{textarea}</CollapsibleContent>
        </Collapsible>
    );
}
