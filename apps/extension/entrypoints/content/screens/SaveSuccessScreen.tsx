import type { Ref } from 'react';

import { PanelShell } from '@/components/codit/panel-shell';
import { formatDuration } from '@/lib/format-duration';

import type { Tag } from '../mockData';
import { RESULT_LABELS, type ResultType } from '../screens';

interface SaveSuccessScreenProps {
    result: ResultType;
    elapsedSeconds: number;
    memo: string;
    tags: Tag[];
    onCollapse?: () => void;
    collapseControlRef?: Ref<HTMLButtonElement>;
}

export function SaveSuccessScreen({
    result,
    elapsedSeconds,
    memo,
    tags,
    onCollapse,
    collapseControlRef,
}: SaveSuccessScreenProps) {
    return (
        <PanelShell
            title="저장 완료"
            onCollapse={onCollapse}
            collapseControlRef={collapseControlRef}
        >
            <div className="flex flex-col gap-4">
                <div className="flex flex-col items-center gap-2 py-1">
                    <span className="bg-success/10 text-success flex size-10 items-center justify-center rounded-full">
                        <svg viewBox="0 0 20 20" fill="none" className="size-5" aria-hidden="true">
                            <path
                                d="M5 10.5l3.2 3.2L15 7"
                                stroke="currentColor"
                                strokeWidth="2"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                            />
                        </svg>
                    </span>
                    <p className="text-sm font-semibold">저장되었어요</p>
                </div>

                <dl className="bg-muted/50 flex flex-col gap-2 rounded-lg p-3 text-sm">
                    <div className="flex justify-between">
                        <dt className="text-muted-foreground">결과</dt>
                        <dd className="font-medium">{RESULT_LABELS[result]}</dd>
                    </div>
                    <div className="flex justify-between">
                        <dt className="text-muted-foreground">풀이 시간</dt>
                        <dd className="font-medium tabular-nums">
                            {formatDuration(elapsedSeconds)}
                        </dd>
                    </div>
                    <div className="flex justify-between gap-4">
                        <dt className="text-muted-foreground shrink-0">태그</dt>
                        <dd className="text-right font-medium">
                            {tags.length > 0 ? tags.map((tag) => tag.name).join(', ') : '없음'}
                        </dd>
                    </div>
                    <div>
                        <dt className="text-muted-foreground">메모</dt>
                        <dd className="mt-1 font-medium break-words whitespace-pre-wrap">
                            {memo.trim() || '없음'}
                        </dd>
                    </div>
                </dl>
            </div>
        </PanelShell>
    );
}
