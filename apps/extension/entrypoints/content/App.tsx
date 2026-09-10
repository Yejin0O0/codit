import { useEffect, useMemo, useRef, useState } from 'react';

import { CoditWidget } from '@/components/codit/codit-widget';

import { isDraftScreen, removeAttemptDraft, writeAttemptDraft } from './attempt-draft/store';
import { ATTEMPT_DRAFT_VERSION, type AttemptDraft } from './attempt-draft/types';
import { CollapsedTimer } from './collapsed-timer';
import { CORE_TAGS, TAG_CATALOG, TAG_CATEGORIES, type Tag } from './mockData';
import { type ResultType, type Screen } from './screens';
import { MemoScreen } from './screens/MemoScreen';
import { ResultSelectScreen } from './screens/ResultSelectScreen';
import { SaveSuccessScreen } from './screens/SaveSuccessScreen';
import { TagSelectScreen } from './screens/TagSelectScreen';
import { TimerScreen } from './screens/TimerScreen';
import { resolveCustomTagInput } from './tag-input';
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
    /** mount.tsx 가 복원한 결과 기록 초안. 생략 시 fresh 흐름(#73). */
    initialDraft?: AttemptDraft;
}

/**
 * 시작 화면을 정한다.
 * - 복원된 결과 기록 초안이 있으면 그 화면(#73) — 세션 상태보다 우선.
 * - 없고 복원된 세션이 이미 완료(stopped)면 결과 선택 화면.
 */
function initialScreen(initialSession?: TimerSession, initialDraft?: AttemptDraft): Screen {
    if (initialDraft) {
        return initialDraft.screen;
    }
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

export default function App({
    problemId,
    problemTitle,
    containerEl,
    initialSession,
    initialDraft,
}: AppProps) {
    const { dragHandlers, reclamp } = useWidgetPosition(containerEl);

    const [viewState, setViewState] = useState<WidgetViewState>('expanded');
    const [screen, setScreen] = useState<Screen>(() => initialScreen(initialSession, initialDraft));
    const [result, setResult] = useState<ResultType | null>(initialDraft?.result ?? null);
    const [memo, setMemo] = useState(initialDraft?.memo ?? '');
    const [memoOpen, setMemoOpen] = useState(initialDraft?.memoOpen ?? false);
    const [selectedTagIds, setSelectedTagIds] = useState<string[]>(
        initialDraft?.selectedTagIds ?? [],
    );
    const [customTags, setCustomTags] = useState<Tag[]>(initialDraft?.customTags ?? []);

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

    // 결과 기록 흐름(result/memo/tags)의 입력을 매 변경마다 storage 에 저장해
    // 새로고침·탭 이동 시 유실을 막는다(#73). timer/success 화면은 저장 대상 아님.
    // "저장" 도달 시 handleSave 가 removeAttemptDraft 로 정리한다.
    useEffect(() => {
        if (!isDraftScreen(screen)) {
            return;
        }
        void writeAttemptDraft(problemId, {
            version: ATTEMPT_DRAFT_VERSION,
            problemId,
            screen,
            result,
            memo,
            memoOpen,
            selectedTagIds,
            customTags,
        });
    }, [problemId, screen, result, memo, memoOpen, selectedTagIds, customTags]);

    const selectedTags = useMemo(() => {
        const pool = [...TAG_CATALOG, ...customTags];

        return selectedTagIds
            .map((id) => pool.find((tag) => tag.id === id))
            .filter((tag): tag is Tag => tag !== undefined);
    }, [selectedTagIds, customTags]);

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
        void removeAttemptDraft(problemId);
    };

    const handleNextFromResult = () => {
        if (result === null) {
            return;
        }
        setScreen('memo');
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
                    result={result}
                    step="3 / 3"
                    coreTags={CORE_TAGS}
                    categories={TAG_CATEGORIES}
                    customTags={customTags}
                    selectedTagIds={selectedTagIds}
                    onSelectedTagIdsChange={setSelectedTagIds}
                    onAddCustomTag={handleAddCustomTag}
                    onBack={() => setScreen('memo')}
                    onSave={handleSave}
                    onCollapse={handleCollapse}
                    collapseControlRef={collapseControlRef}
                    dragHandlers={dragHandlers}
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
