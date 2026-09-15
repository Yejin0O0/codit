import type { Meta, StoryObj } from '@storybook/react-vite';

import { HistoryView } from '@/entrypoints/page/history/history-view';

import { ExtensionPageShell } from './extension-page-shell';
import { PageHeader } from './page-header';

/**
 * [UI-L2 R7] 스파이크 — 페이지 공통 프레임.
 * 실제 HistoryView(mock data)를 각 후보 프레임 안에 넣어 놓고 비교한다.
 * `ExtensionPageShell`/`PageHeader` 는 손대지 않고 `className`/`header` 슬롯 조합만으로
 * 5개 방향을 표현했다 — 골라준 안을 기준으로 컴포넌트 자체를 확정 구현한다.
 */
const meta: Meta = {
    title: 'Page/ExtensionPageShell',
    parameters: { layout: 'fullscreen', backgrounds: { value: 'page' } },
};

export default meta;
type Story = StoryObj;

const MAX_WIDTH = 720;

export const Current: Story = {
    name: '기준 — 현재 그대로',
    render: () => (
        <ExtensionPageShell maxWidth={MAX_WIDTH} header={<PageHeader userName="you@example.com" />}>
            <HistoryView />
        </ExtensionPageShell>
    ),
};

export const OptionA: Story = {
    name: 'A — 헤더 리듬만 정리 (border 유지)',
    render: () => (
        <ExtensionPageShell
            maxWidth={MAX_WIDTH}
            header={<PageHeader userName="you@example.com" className="bg-background py-3.5" />}
        >
            <HistoryView />
        </ExtensionPageShell>
    ),
};
/**
 * A — 최소 변경안. border-b 는 유지, 헤더 배경만 bg-background 로 명시해
 * muted 바디와 살짝 분리하고, spacing 을 위젯 헤더(py-3.5)와 맞춘다.
 * 리스크 가장 낮음 — 기존 톤을 거의 그대로 유지.
 */

export const OptionB: Story = {
    name: 'B — Shadow 카드 헤더 (위젯 톤 echo)',
    render: () => (
        <ExtensionPageShell
            maxWidth={MAX_WIDTH}
            header={
                <PageHeader
                    userName="you@example.com"
                    className="bg-background border-b-0 py-3.5 shadow-sm"
                />
            }
        >
            <HistoryView />
        </ExtensionPageShell>
    ),
};
/**
 * B — PanelShell 의 `shadow-lg` "Codit 패널" 정체성을 페이지 헤더에도 echo.
 * border 대신 shadow 로 분리해 위젯과 페이지가 같은 브랜드 언어를 쓰는 느낌.
 */

export const OptionC: Story = {
    name: 'C — Sticky 헤더 + 콘텐츠 카드',
    render: () => (
        <ExtensionPageShell
            maxWidth={MAX_WIDTH}
            header={
                <PageHeader
                    userName="you@example.com"
                    className="bg-background/95 sticky top-0 z-10 py-3.5 backdrop-blur-sm"
                />
            }
        >
            <div className="bg-background rounded-lg border p-4 shadow-sm">
                <HistoryView />
            </div>
        </ExtensionPageShell>
    ),
};
/**
 * C — 헤더를 스크롤에 고정(sticky)하고, 본문을 카드로 한 번 더 감싼다.
 * 히스토리 목록이 길어질 때 상단바가 항상 보이는 게 장점. 다만 ProblemCard 가 이미
 * 리스트형 프레임을 가지고 있어 "카드 안 카드" 로 겹쳐 보일 위험 — 비교 시 확인 포인트.
 */

export const OptionD: Story = {
    name: 'D — 브랜드 액센트 스트라이프',
    render: () => (
        <ExtensionPageShell
            maxWidth={MAX_WIDTH}
            header={
                <>
                    <div className="bg-primary h-1" aria-hidden="true" />
                    <PageHeader userName="you@example.com" className="bg-background border-b-0 py-3.5" />
                </>
            }
        >
            <HistoryView />
        </ExtensionPageShell>
    ),
};
/**
 * D — 굵은 프레임(테두리·그림자) 대신 얇은 primary 컬러 스트라이프 하나로
 * Codit 브랜드를 가볍게 각인. 헤더 자체는 border 없이 플랫.
 */

export const OptionE: Story = {
    name: 'E — 여백 기반 분리 (무테두리)',
    render: () => (
        <ExtensionPageShell
            maxWidth={MAX_WIDTH}
            className="pt-2"
            header={<PageHeader userName="you@example.com" className="border-b-0 pt-4 pb-6" />}
        >
            <HistoryView />
        </ExtensionPageShell>
    ),
};
/**
 * E — 구분선·그림자 전부 제거하고 여백(padding)만으로 헤더/본문을 분리.
 * PanelShell R0 스파이크에서 검토했던 "여백 기반 분리" 대안을 페이지에도 적용.
 * 가장 가벼운 톤이지만 muted 배경 위에서 헤더 경계가 약하게 느껴질 수 있음 — 확인 포인트.
 */

export const AuthPlaceholder: Story = {
    name: '참고 — 로그인 전 (좁은 폭, 기준안)',
    render: () => (
        <ExtensionPageShell maxWidth={400} header={<PageHeader />}>
            <section aria-label="로그인 화면 자리">
                <p className="text-muted-foreground text-sm">
                    로그인 화면은 이후 이슈에서 구현됩니다.
                </p>
            </section>
        </ExtensionPageShell>
    ),
};
