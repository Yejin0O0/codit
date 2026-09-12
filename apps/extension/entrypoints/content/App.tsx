import { useEffect, useMemo, useRef, useState } from 'react';

import { CoditWidget } from '@/components/codit/codit-widget';
import { useTags } from '@/hooks/useTags';
import type { TagOption } from '@/lib/tag-catalog';

import { CollapsedTimer } from './collapsed-timer';
import { type ResultType, type Screen } from './screens';
import { MemoScreen } from './screens/MemoScreen';
import { ResultSelectScreen } from './screens/ResultSelectScreen';
import { SaveSuccessScreen } from './screens/SaveSuccessScreen';
import { TagSelectScreen } from './screens/TagSelectScreen';
import { TimerScreen } from './screens/TimerScreen';
import { markCompleted } from './timer-session/session';
import { removeTimerSession, writeTimerSession } from './timer-session/store';
import type { TimerSession } from './timer-session/types';
import { useTimer } from './useTimer';
import { useWidgetPosition } from './useWidgetPosition';

/** 위젯 표현 상태 — screen 과 별개. 새 mount 는 항상 expanded. */
type WidgetViewState = 'expanded' | 'collapsed';

interface AppProps {
    /** 현재 SWEA 문제의 contestProbId (content script 가 URL 에서 파싱해 주입) */
    problemId: string;
    /** SWEA 페이지에서 읽은 실제 문제 제목. 없으면 TimerScreen이 problemId로 폴백 표시. */
    problemTitle?: string | null;
    /** `#codit-root` element (mount.tsx 주입). 위치·드래그 제어용. 테스트에서 생략 가능. */
    containerEl?: HTMLElement | null;
    /** mount.tsx 가 복원/생성한 Timer Session. 생략 시 fresh 세션으로 동작(테스트 편의). */
    initialSession?: TimerSession;
}

/** 복원된 세션이 이미 완료(stopped)면 결과 선택 화면에서 시작한다. */
function initialScreen(initialSession?: TimerSession): Screen {
    if (initialSession && initialSession.status === 'stopped') {
        return 'result';
    }
    return 'timer';
}

/** initialSession 에서 useTimer 가 받는 최소 입력만 추려낸다. */
function initialTimerInit(
    initialSession?: TimerSession,
): { startedAt: number; stoppedAt: number | null } | undefined {
    if (!initialSession) {
        return undefined;
    }
    return { startedAt: initialSession.startedAt, stoppedAt: initialSession.stoppedAt };
}

export default function App({ problemId, problemTitle, containerEl, initialSession }: AppProps) {
    const { dragHandlers, reclamp } = useWidgetPosition(containerEl);

    const [viewState, setViewState] = useState<WidgetViewState>('expanded');
    const [screen, setScreen] = useState<Screen>(() => initialScreen(initialSession));
    const [result, setResult] = useState<ResultType | null>(null);
    const [memo, setMemo] = useState('');
    const [memoOpen, setMemoOpen] = useState(false);
    const [selectedTagIds, setSelectedTagIds] = useState<string[]>([]);

    const { coreTags, categories, customTags, isLoading: tagsLoading, error: tagsError, refetch: refetchTags, addCustomTag } = useTags();;

    const { elapsedSeconds, stop } = useTimer(initialTimerInit(initialSession));

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

    // collapsed↔expanded 로 위젯 크기가 바뀌면 현재 위치를 새 크기 기준으로 재clamp 한다.
    // (가장자리로 옮긴 pill 을 펼칠 때 넓은 패널이 뷰포트 밖으로 나가는 것 방지)
    useEffect(() => {
        reclamp();
    }, [viewState, reclamp]);

    const selectedTags = useMemo(() => {
        const pool: TagOption[] = [...coreTags, ...categories.flatMap((c) => c.tags), ...customTags];
        return selectedTagIds
            .map((id) => pool.find((tag) => tag.id === id))
            .filter((tag): tag is TagOption => tag !== undefined);
    }, [selectedTagIds, coreTags, categories, customTags]);

    const handleComplete = () => {
        stop();
        setScreen('result');
        if (initialSession) {
            void writeTimerSession(problemId, markCompleted(initialSession, Date.now()));
        }
    };

    const handleSave = () => {
        setScreen('success');
        if (initialSession) {
            void removeTimerSession(problemId);
        }
    };

    const handleNextFromResult = () => {
        if (result === null) {
            return;
        }
        setScreen('memo');
    };

    const handleAddCustomTag = async (name: string): Promise<boolean> => {
        const tag = await addCustomTag(name);
        if (!tag) return false;
        setSelectedTagIds((prev) => (prev.includes(tag.id) ? prev : [...prev, tag.id]));
        return true;
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
                    dragHandlers={dragHandlers}
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
                    dragHandlers={dragHandlers}
                />
            </CoditWidget>
        );
    }

    if (screen === 'memo' && result !== null) {
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
                    dragHandlers={dragHandlers}
                />
            </CoditWidget>
        );
    }

    if (screen === 'tags' && result !== null) {
        return (
            <CoditWidget>
                <TagSelectScreen
                    step="3 / 3"
                    coreTags={coreTags}
                    categories={categories}
                    customTags={customTags}
                    selectedTagIds={selectedTagIds}
                    onSelectedTagIdsChange={setSelectedTagIds}
                    onAddCustomTag={handleAddCustomTag}
                    onBack={() => setScreen('memo')}
                    onSave={handleSave}
                    onCollapse={handleCollapse}
                    collapseControlRef={collapseControlRef}
                    dragHandlers={dragHandlers}
                    isLoading={tagsLoading}
                    error={tagsError}
                    onRetry={refetchTags}
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
                    dragHandlers={dragHandlers}
                />
            </CoditWidget>
        );
    }

    return (
        <CoditWidget>
            <TimerScreen
                problemId={problemId}
                problemTitle={problemTitle}
                elapsedSeconds={elapsedSeconds}
                onComplete={handleComplete}
                onCollapse={handleCollapse}
                collapseControlRef={collapseControlRef}
                dragHandlers={dragHandlers}
            />
        </CoditWidget>
    );
}
