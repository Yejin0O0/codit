import { useState } from 'react';

import { BrandHeader } from '@/components/codit/brand-header';
import { PanelShell } from '@/components/codit/panel-shell';
import { ResultBadge } from '@/components/codit/result-badge';
import { TagChipList } from '@/components/codit/tag-chip-list';
import { TimerDisplay } from '@/components/codit/timer-display';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { Textarea } from '@/components/ui/textarea';
import { Toggle } from '@/components/ui/toggle';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { CollapsedTimer } from '@/entrypoints/content/collapsed-timer';
import { ResultToggleGroup } from '@/entrypoints/content/components/ResultToggleGroup';
import type { ResultType } from '@/entrypoints/content/screens';
import { CORE_TAGS } from '@/lib/tag-catalog';

/**
 * 디자인 시스템 갤러리 — 토큰 스와치 + 프리미티브 + Codit 조합 컴포넌트를 한 페이지에.
 * `/design-system` 스킬의 시각 QA 대상(`e2e/design-system.spec.ts`가 스크린샷·대비 검사).
 * dev/QA 전용 — manifest 어디에서도 링크되지 않는다.
 */

const COLOR_TOKENS = [
    'background',
    'foreground',
    'card',
    'card-foreground',
    'popover',
    'popover-foreground',
    'primary',
    'primary-foreground',
    'secondary',
    'secondary-foreground',
    'muted',
    'muted-foreground',
    'accent',
    'accent-foreground',
    'destructive',
    'destructive-foreground',
    'success',
    'success-foreground',
    'warning',
    'warning-foreground',
    'border',
    'input',
    'ring',
] as const;

/**
 * fg/bg 쌍 — 스펙이 canvas 로 sRGB화해 WCAG 명도비를 계산한다.
 * `min`은 baseline(shadcn neutral) 기준 하한. `/design-system` Phase 2에서
 * 텍스트 쌍(destructive·success·muted)을 4.5로 조인다.
 */
const CONTRAST_PAIRS = [
    { name: 'primary', className: 'bg-primary text-primary-foreground', label: '주요 버튼', min: 4.5 },
    {
        name: 'secondary',
        className: 'bg-secondary text-secondary-foreground',
        label: '보조 버튼',
        min: 4.5,
    },
    { name: 'destructive', className: 'bg-destructive text-white', label: '오답', min: 3 },
    { name: 'success', className: 'bg-success text-success-foreground', label: '정답', min: 3 },
    { name: 'warning', className: 'bg-warning text-warning-foreground', label: '보류', min: 4.5 },
    { name: 'muted', className: 'bg-muted text-muted-foreground', label: '보조 텍스트', min: 4 },
    { name: 'foreground', className: 'bg-background text-foreground', label: '본문', min: 4.5 },
] as const;

function Section({ id, title, children }: { id: string; title: string; children: React.ReactNode }) {
    return (
        <section id={id} className="mb-12">
            <h2 className="text-muted-foreground mb-4 text-xs font-semibold tracking-widest uppercase">
                {title}
            </h2>
            <div className="flex flex-col gap-6">{children}</div>
        </section>
    );
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
    return (
        <div className="grid grid-cols-[8rem_1fr] items-center gap-4">
            <span className="text-muted-foreground text-xs">{label}</span>
            <div className="flex flex-wrap items-center gap-3">{children}</div>
        </div>
    );
}

export default function GalleryApp() {
    const [result, setResult] = useState<ResultType | null>('CORRECT');
    const [toggleOn, setToggleOn] = useState(true);
    const [segment, setSegment] = useState('all');

    return (
        <main className="mx-auto max-w-3xl px-6 py-10">
            <header className="mb-10">
                <h1 className="text-xl font-semibold">Codit Design System Gallery</h1>
                <p className="text-muted-foreground text-sm">
                    토큰 · 프리미티브 · 조합 컴포넌트. 리스킨 시각 QA 기준.
                </p>
            </header>

            <Section id="tokens-color" title="색 토큰">
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                    {COLOR_TOKENS.map((token) => (
                        <div
                            key={token}
                            data-token={token}
                            className="flex items-center gap-2 rounded-md border p-2"
                        >
                            <span
                                className="size-8 shrink-0 rounded border"
                                style={{ background: `var(--${token})` }}
                            />
                            <code className="text-xs">--{token}</code>
                        </div>
                    ))}
                </div>
            </Section>

            <Section id="tokens-contrast" title="대비 쌍 (fg / bg)">
                <div className="flex flex-col gap-2">
                    {CONTRAST_PAIRS.map((pair) => (
                        <div
                            key={pair.name}
                            data-contrast-pair={pair.name}
                            data-contrast-min={pair.min}
                            className={`flex items-center justify-between rounded-md px-3 py-2 text-sm ${pair.className}`}
                        >
                            <span data-contrast-text>{pair.label} — 다람쥐 헌 쳇바퀴에 타고파</span>
                            <span className="text-xs opacity-70">
                                {pair.name} · min {pair.min}
                            </span>
                        </div>
                    ))}
                </div>
            </Section>

            <Section id="tokens-radius" title="radius 스케일">
                <Row label="sm / md / lg / xl">
                    <span className="bg-muted size-12 rounded-sm" />
                    <span className="bg-muted size-12 rounded-md" />
                    <span className="bg-muted size-12 rounded-lg" />
                    <span className="bg-muted size-12 rounded-xl" />
                </Row>
            </Section>

            <Section id="primitives-button" title="Button">
                <Row label="variant">
                    <Button>default</Button>
                    <Button variant="secondary">secondary</Button>
                    <Button variant="outline">outline</Button>
                    <Button variant="ghost">ghost</Button>
                    <Button variant="destructive">destructive</Button>
                    <Button variant="link">link</Button>
                </Row>
                <Row label="size">
                    <Button size="sm">sm</Button>
                    <Button size="default">default</Button>
                    <Button size="lg">lg</Button>
                </Row>
                <Row label="disabled">
                    <Button disabled>disabled</Button>
                </Row>
            </Section>

            <Section id="primitives-badge" title="Badge">
                <Row label="variant">
                    <Badge>default</Badge>
                    <Badge variant="secondary">secondary</Badge>
                    <Badge variant="outline">outline</Badge>
                    <Badge variant="destructive">destructive</Badge>
                </Row>
            </Section>

            <Section id="primitives-form" title="폼 프리미티브">
                <Row label="Input">
                    <Input placeholder="태그를 입력하세요" className="max-w-xs" />
                </Row>
                <Row label="Textarea">
                    <Textarea placeholder="메모" className="max-w-xs" />
                </Row>
                <Row label="Label">
                    <Label>라벨</Label>
                </Row>
            </Section>

            <Section id="primitives-toggle" title="Toggle · ToggleGroup">
                <Row label="Toggle">
                    <Toggle pressed={toggleOn} onPressedChange={setToggleOn}>
                        토글
                    </Toggle>
                </Row>
                <Row label="ToggleGroup">
                    <ToggleGroup
                        type="single"
                        variant="outline"
                        value={segment}
                        onValueChange={(v) => v && setSegment(v)}
                    >
                        <ToggleGroupItem value="all">전체</ToggleGroupItem>
                        <ToggleGroupItem value="correct">정답</ToggleGroupItem>
                        <ToggleGroupItem value="wrong">오답</ToggleGroupItem>
                        <ToggleGroupItem value="hold">보류</ToggleGroupItem>
                    </ToggleGroup>
                </Row>
            </Section>

            <Section id="primitives-misc" title="Card · Collapsible · Skeleton">
                <Card className="max-w-xs">
                    <CardHeader>
                        <CardTitle>카드 제목</CardTitle>
                    </CardHeader>
                    <CardContent>카드 본문 내용</CardContent>
                </Card>
                <Collapsible className="max-w-xs">
                    <CollapsibleTrigger className="text-primary text-sm underline-offset-4 hover:underline">
                        더보기
                    </CollapsibleTrigger>
                    <CollapsibleContent className="text-muted-foreground pt-2 text-sm">
                        펼쳐진 내용
                    </CollapsibleContent>
                </Collapsible>
                <div className="flex max-w-xs flex-col gap-2">
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-2/3" />
                </div>
            </Section>

            <Section id="compositions-brand" title="BrandHeader">
                <Row label="full">
                    <BrandHeader variant="full" />
                </Row>
                <Row label="compact">
                    <BrandHeader variant="compact" />
                </Row>
            </Section>

            <Section id="compositions-timer" title="TimerDisplay · CollapsedTimer">
                <Row label="TimerDisplay">
                    <TimerDisplay seconds={754} caption="경과 시간" />
                </Row>
                <Row label="CollapsedTimer">
                    <div className="relative flex gap-4">
                        <CollapsedTimer seconds={754} status="running" onExpand={() => {}} />
                        <CollapsedTimer seconds={754} status="stopped" onExpand={() => {}} />
                    </div>
                </Row>
            </Section>

            <Section id="compositions-result" title="ResultBadge · ResultToggleGroup">
                <Row label="ResultBadge">
                    <ResultBadge result="CORRECT" />
                    <ResultBadge result="WRONG" />
                    <ResultBadge result="HOLD" />
                </Row>
                <Row label="ResultToggleGroup">
                    <div className="w-72">
                        <ResultToggleGroup value={result} onChange={setResult} />
                    </div>
                </Row>
            </Section>

            <Section id="compositions-tags" title="TagChipList">
                <Row label="chips">
                    <TagChipList
                        tagIds={CORE_TAGS.slice(0, 4).map((t) => t.id)}
                        catalog={CORE_TAGS}
                    />
                </Row>
            </Section>

            <Section id="compositions-panel" title="PanelShell (위젯 프레임)">
                <div className="w-[320px]">
                    <PanelShell title="결과 선택" step="2 / 4">
                        <div className="flex flex-col gap-4">
                            <TimerDisplay seconds={754} caption="풀이 시간" />
                            <ResultToggleGroup value={result} onChange={setResult} />
                            <Button className="w-full">다음</Button>
                        </div>
                    </PanelShell>
                </div>
            </Section>
        </main>
    );
}
