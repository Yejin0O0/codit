import { useMemo, useState } from 'react';

import { CoditWidget } from '@/components/codit/codit-widget';

import { CORE_TAGS, MOCK_PROBLEM, TAG_CATEGORIES, type Tag } from './mockData';
import { type ResultType, type Screen } from './screens';
import { MemoScreen } from './screens/MemoScreen';
import { ResultSelectScreen } from './screens/ResultSelectScreen';
import { SaveSuccessScreen } from './screens/SaveSuccessScreen';
import { TagSelectScreen } from './screens/TagSelectScreen';
import { TimerScreen } from './screens/TimerScreen';
import { useTimer } from './useTimer';

const PREDEFINED_TAGS: Tag[] = [
    ...CORE_TAGS,
    ...TAG_CATEGORIES.flatMap((category) => category.tags),
];

function toCustomTagId(name: string): string {
    return `custom:${name.trim().toLowerCase().replace(/\s+/g, '-')}`;
}

/** 결과가 메모 화면을 거치는가 (HOLD 는 건너뜀) */
function hasMemoStep(result: ResultType | null): boolean {
    return result === 'CORRECT' || result === 'WRONG';
}

export default function App() {
    const [screen, setScreen] = useState<Screen>('timer');
    const [result, setResult] = useState<ResultType | null>(null);
    const [memo, setMemo] = useState('');
    const [memoOpen, setMemoOpen] = useState(false);
    const [selectedTagIds, setSelectedTagIds] = useState<string[]>([]);
    const [customTags, setCustomTags] = useState<Tag[]>([]);

    const { elapsedSeconds, stop } = useTimer();

    const selectedTags = useMemo(() => {
        const pool = [...PREDEFINED_TAGS, ...customTags];

        return selectedTagIds
            .map((id) => pool.find((tag) => tag.id === id))
            .filter((tag): tag is Tag => tag !== undefined);
    }, [selectedTagIds, customTags]);

    const tagStep = hasMemoStep(result) ? '3 / 3' : '2 / 2';

    const handleComplete = () => {
        stop();
        setScreen('result');
    };

    const handleNextFromResult = () => {
        if (result === null) {
            return;
        }
        if (hasMemoStep(result)) {
            setScreen('memo');
        } else {
            // HOLD: 메모 화면을 거치지 않는다.
            setMemo('');
            setMemoOpen(false);
            setScreen('tags');
        }
    };

    const handleAddCustomTag = (name: string) => {
        const trimmed = name.trim();
        if (!trimmed) {
            return;
        }

        const id = toCustomTagId(trimmed);
        const duplicate = [...PREDEFINED_TAGS, ...customTags].some(
            (tag) => tag.id === id || tag.name.toLowerCase() === trimmed.toLowerCase(),
        );

        if (!duplicate) {
            setCustomTags((prev) => [...prev, { id, name: trimmed }]);
        }
        setSelectedTagIds((prev) => (prev.includes(id) ? prev : [...prev, id]));
    };

    if (screen === 'result') {
        return (
            <CoditWidget>
                <ResultSelectScreen
                    elapsedSeconds={elapsedSeconds}
                    value={result}
                    onChange={setResult}
                    onNext={handleNextFromResult}
                />
            </CoditWidget>
        );
    }

    if (screen === 'memo' && result !== null && hasMemoStep(result)) {
        return (
            <CoditWidget>
                <MemoScreen
                    result={result}
                    step="2 / 3"
                    memo={memo}
                    onMemoChange={setMemo}
                    memoOpen={memoOpen}
                    onMemoOpenChange={setMemoOpen}
                    onBack={() => setScreen('result')}
                    onNext={() => setScreen('tags')}
                />
            </CoditWidget>
        );
    }

    if (screen === 'tags' && result !== null) {
        return (
            <CoditWidget>
                <TagSelectScreen
                    step={tagStep}
                    coreTags={CORE_TAGS}
                    categories={TAG_CATEGORIES}
                    customTags={customTags}
                    selectedTagIds={selectedTagIds}
                    onSelectedTagIdsChange={setSelectedTagIds}
                    onAddCustomTag={handleAddCustomTag}
                    onBack={() => setScreen(hasMemoStep(result) ? 'memo' : 'result')}
                    onSave={() => setScreen('success')}
                />
            </CoditWidget>
        );
    }

    if (screen === 'success' && result !== null) {
        return (
            <CoditWidget>
                <SaveSuccessScreen
                    result={result}
                    elapsedSeconds={elapsedSeconds}
                    memo={memo}
                    tags={selectedTags}
                />
            </CoditWidget>
        );
    }

    return (
        <CoditWidget>
            <TimerScreen
                problemId={MOCK_PROBLEM.problemId}
                elapsedSeconds={elapsedSeconds}
                onComplete={handleComplete}
            />
        </CoditWidget>
    );
}
