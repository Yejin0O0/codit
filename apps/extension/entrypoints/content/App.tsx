import { useEffect, useMemo, useRef, useState } from 'react';

import { CoditWidget } from '@/components/codit/codit-widget';

import { CollapsedTimer } from './collapsed-timer';
import { CORE_TAGS, TAG_CATALOG, TAG_CATEGORIES, type Tag } from './mockData';
import { type ResultType, type Screen } from './screens';
import { MemoScreen } from './screens/MemoScreen';
import { ResultSelectScreen } from './screens/ResultSelectScreen';
import { SaveSuccessScreen } from './screens/SaveSuccessScreen';
import { TagSelectScreen } from './screens/TagSelectScreen';
import { TimerScreen } from './screens/TimerScreen';
import { resolveCustomTagInput } from './tag-input';
import { useTimer } from './useTimer';

/** 위젯 표현 상태 — screen 과 별개. 새 mount 는 항상 expanded. */
type WidgetViewState = 'expanded' | 'collapsed';

interface AppProps {
    /** 현재 SWEA 문제의 contestProbId (content script 가 URL 에서 파싱해 주입) */
    problemId: string;
}

/** 결과가 메모 화면을 거치는가 (HOLD 는 건너뜀) */
function hasMemoStep(result: ResultType | null): boolean {
    return result === 'CORRECT' || result === 'WRONG';
}

export default function App({ problemId }: AppProps) {
    const [viewState, setViewState] = useState<WidgetViewState>('expanded');
    const [screen, setScreen] = useState<Screen>('timer');
    const [result, setResult] = useState<ResultType | null>(null);
    const [memo, setMemo] = useState('');
    const [memoOpen, setMemoOpen] = useState(false);
    const [selectedTagIds, setSelectedTagIds] = useState<string[]>([]);
    const [customTags, setCustomTags] = useState<Tag[]>([]);

    const { elapsedSeconds, stop } = useTimer();

    const pillRef = useRef<HTMLButtonElement>(null);
    const collapseControlRef = useRef<HTMLButtonElement>(null);
    const isInitialRender = useRef(true);

    // 접기/펼치기 후 대응 컨트롤로 포커스를 옮겨 키보드 흐름을 잇는다.
    // 초기 mount(expanded) 는 제외 — SWEA 페이지 로드 시 위젯이 포커스를 뺏지 않는다.
    useEffect(() => {
        if (isInitialRender.current) {
            isInitialRender.current = false;
            return;
        }
        if (viewState === 'collapsed') {
            pillRef.current?.focus();
        } else {
            collapseControlRef.current?.focus();
        }
    }, [viewState]);

    const selectedTags = useMemo(() => {
        const pool = [...TAG_CATALOG, ...customTags];

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
        const resolved = resolveCustomTagInput(name, [...TAG_CATALOG, ...customTags]);
        if (!resolved) {
            return;
        }

        // 같은 이름이 이미 있으면 그 태그 id 를 선택한다 — 새 custom id 를 만들지 않는다.
        if (resolved.isNew) {
            setCustomTags((prev) => [...prev, resolved.tag]);
        }
        setSelectedTagIds((prev) =>
            prev.includes(resolved.tag.id) ? prev : [...prev, resolved.tag.id],
        );
    };

    const handleCollapse = () => setViewState('collapsed');

    if (viewState === 'collapsed') {
        // "완료"(stop) 전이면 타이머 화면(screen === 'timer')이므로 아직 running.
        const collapsedStatus = screen === 'timer' ? 'running' : 'stopped';

        return (
            <CoditWidget>
                <CollapsedTimer
                    ref={pillRef}
                    seconds={elapsedSeconds}
                    status={collapsedStatus}
                    onExpand={() => setViewState('expanded')}
                />
            </CoditWidget>
        );
    }

    if (screen === 'result') {
        return (
            <CoditWidget>
                <ResultSelectScreen
                    elapsedSeconds={elapsedSeconds}
                    value={result}
                    onChange={setResult}
                    onNext={handleNextFromResult}
                    onCollapse={handleCollapse}
                    collapseControlRef={collapseControlRef}
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
                    onCollapse={handleCollapse}
                    collapseControlRef={collapseControlRef}
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
                    onCollapse={handleCollapse}
                    collapseControlRef={collapseControlRef}
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
                    onCollapse={handleCollapse}
                    collapseControlRef={collapseControlRef}
                />
            </CoditWidget>
        );
    }

    return (
        <CoditWidget>
            <TimerScreen
                problemId={problemId}
                elapsedSeconds={elapsedSeconds}
                onComplete={handleComplete}
                onCollapse={handleCollapse}
                collapseControlRef={collapseControlRef}
            />
        </CoditWidget>
    );
}
