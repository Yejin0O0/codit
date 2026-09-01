export type Screen = 'timer' | 'result' | 'memo' | 'tags' | 'success';

export type ResultType = 'CORRECT' | 'WRONG' | 'HOLD';

export const RESULT_LABELS: Record<ResultType, string> = {
    CORRECT: '정답',
    WRONG: '오답',
    HOLD: '보류',
};

export const RESULT_OPTIONS: { value: ResultType; label: string }[] = [
    { value: 'CORRECT', label: '정답' },
    { value: 'WRONG', label: '오답' },
    { value: 'HOLD', label: '보류' },
];
