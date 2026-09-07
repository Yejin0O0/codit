import type { Meta, StoryObj } from '@storybook/react-vite';
import { useEffect, useState, type CSSProperties } from 'react';


import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ResultToggleGroup } from '@/entrypoints/content/components/ResultToggleGroup';
import { MemoScreen } from '@/entrypoints/content/screens/MemoScreen';
import { ResultSelectScreen } from '@/entrypoints/content/screens/ResultSelectScreen';
import { SaveSuccessScreen } from '@/entrypoints/content/screens/SaveSuccessScreen';
import { TagSelectScreen } from '@/entrypoints/content/screens/TagSelectScreen';
import { TimerScreen } from '@/entrypoints/content/screens/TimerScreen';
import { CORE_TAGS, TAG_CATEGORIES } from '@/lib/tag-catalog';

/**
 * 디자인 토큰을 실시간으로 조정하며 **실제 Codit 컴포넌트**에 적용해보는 플레이그라운드.
 * 색·radius·여백·그림자·타이포를 바꾸면 오른쪽 위젯 화면 전체에 즉시 반영된다.
 * `/design-system` Phase 2 의 결정 도구. 확정값은 아래 "CSS 내보내기"로 복사해 개발자가 Claude 에게 전달.
 * (mockup 이 아니라 `entrypoints/content/screens/*` 실물을 렌더한다.)
 */

const COLOR_KEYS = [
    'primary',
    'primary-foreground',
    'ring',
    'accent',
    'accent-foreground',
    'background',
    'foreground',
    'card',
    'muted',
    'muted-foreground',
    'secondary',
    'secondary-foreground',
    'border',
    'input',
    'success',
    'success-foreground',
    'warning',
    'warning-foreground',
    'destructive',
    'destructive-foreground',
] as const;
type ColorKey = (typeof COLOR_KEYS)[number];

const CONFIRMED: Record<ColorKey, string> = {
    primary: '#6E56CF',
    'primary-foreground': '#FFFFFF',
    ring: '#A594F9',
    accent: '#F1EEFE',
    'accent-foreground': '#6550B9',
    background: '#FAF9FC',
    foreground: '#1A1523',
    card: '#FFFFFF',
    muted: '#F1EFF5',
    'muted-foreground': '#65636E',
    secondary: '#F1EFF5',
    'secondary-foreground': '#211E28',
    border: '#D8D3E0',
    input: '#C4BDD2',
    success: '#30A46C',
    'success-foreground': '#FFFFFF',
    warning: '#FFC53D',
    'warning-foreground': '#4F3422',
    destructive: '#E5484D',
    'destructive-foreground': '#FFFFFF',
};

const PRESETS: Record<string, Partial<Record<ColorKey, string>>> = {
    'Radix 기반 (추천)': CONFIRMED,
    'primary 진하게': { ...CONFIRMED, primary: '#654DC4', ring: '#8B77E8' },
    'primary 더 파랑 (iris)': { ...CONFIRMED, primary: '#5B5BD6', ring: '#9B9EF0', 'accent-foreground': '#5753C6' },
    '구분 더 강하게': { ...CONFIRMED, background: '#F6F4FA', border: '#CBC3D8', input: '#B4AAC8', 'muted-foreground': '#5C5A66' },
    '현재 (shadcn neutral)': {
        primary: '#343434', 'primary-foreground': '#FBFBFB', ring: '#B4B4B4', accent: '#F7F7F7', 'accent-foreground': '#343434',
        background: '#FFFFFF', foreground: '#252525', card: '#FFFFFF', muted: '#F7F7F7', 'muted-foreground': '#8E8E8E',
        secondary: '#F7F7F7', 'secondary-foreground': '#343434', border: '#EBEBEB', input: '#EBEBEB',
        success: '#3E9B77', 'success-foreground': '#FBFBFB', warning: '#E8B923', 'warning-foreground': '#252525',
        destructive: '#E5484D', 'destructive-foreground': '#FBFBFB',
    },
};

const USE_NOTE: Partial<Record<ColorKey, string>> = {
    primary: '주요 버튼·링크·포커스링·로고',
    'muted-foreground': "캡션·'측정 중'·날짜",
    border: '카드·구분선·미선택 토글',
    input: '입력창 테두리',
    success: '정답 토글·배지·완료 체크',
    warning: '보류 토글·배지',
    destructive: '오답 토글·배지·삭제',
};

interface Scale {
    radius: number;
    pad: number;
    shadowStrength: 'soft' | 'med' | 'strong';
    shadowTint: 'violet' | 'gray';
    lh: number;
}
const DEFAULT_SCALE: Scale = { radius: 10, pad: 16, shadowStrength: 'med', shadowTint: 'violet', lh: 1.6 };

const SHADOWS: Record<string, string> = {
    'soft-violet': '0 10px 26px -12px color-mix(in srgb, var(--primary) 24%, transparent), 0 2px 8px -2px color-mix(in srgb, var(--foreground) 8%, transparent)',
    'med-violet': '0 16px 40px -12px color-mix(in srgb, var(--primary) 28%, transparent), 0 4px 12px -2px color-mix(in srgb, var(--foreground) 10%, transparent)',
    'strong-violet': '0 22px 52px -14px color-mix(in srgb, var(--primary) 34%, transparent), 0 6px 16px -3px color-mix(in srgb, var(--foreground) 12%, transparent)',
    'soft-gray': '0 10px 26px -12px color-mix(in srgb, var(--foreground) 14%, transparent), 0 2px 8px -2px color-mix(in srgb, var(--foreground) 8%, transparent)',
    'med-gray': '0 16px 40px -12px color-mix(in srgb, var(--foreground) 20%, transparent), 0 4px 12px -2px color-mix(in srgb, var(--foreground) 10%, transparent)',
    'strong-gray': '0 22px 52px -14px color-mix(in srgb, var(--foreground) 26%, transparent), 0 6px 16px -3px color-mix(in srgb, var(--foreground) 12%, transparent)',
};

// WCAG
function srgb(hex: string) {
    let h = hex.replace('#', '');
    if (h.length === 3) h = h.split('').map((c) => c + c).join('');
    return [0, 2, 4].map((i) => parseInt(h.slice(i, i + 2), 16) / 255);
}
const lin = (c: number) => (c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4);
const lum = (hex: string) => {
    const [r, g, b] = srgb(hex).map(lin);
    return 0.2126 * r + 0.7152 * g + 0.0722 * b;
};
const ratio = (a: string, b: string) => {
    const [l1, l2] = [lum(a), lum(b)];
    const [hi, lo] = l1 > l2 ? [l1, l2] : [l2, l1];
    return (hi + 0.05) / (lo + 0.05);
};
const PAIRS: [ColorKey, ColorKey, number][] = [
    ['primary-foreground', 'primary', 3],
    ['accent-foreground', 'accent', 4.5],
    ['foreground', 'background', 4.5],
    ['muted-foreground', 'muted', 4.5],
    ['success-foreground', 'success', 3],
    ['warning-foreground', 'warning', 4.5],
    ['destructive-foreground', 'destructive', 3],
];

function Playground() {
    const [tokens, setTokens] = useState<Record<ColorKey, string>>(() => {
        try {
            const s = JSON.parse(localStorage.getItem('codit-ds-tokens') || 'null');
            if (s) return { ...CONFIRMED, ...s };
        } catch {
            /* ignore */
        }
        return { ...CONFIRMED };
    });
    const [scale, setScale] = useState<Scale>(() => {
        try {
            const s = JSON.parse(localStorage.getItem('codit-ds-scale') || 'null');
            if (s) return { ...DEFAULT_SCALE, ...s };
        } catch {
            /* ignore */
        }
        return DEFAULT_SCALE;
    });
    const [screen, setScreen] = useState('결과 선택');
    const [result, setResult] = useState<'CORRECT' | 'WRONG' | 'HOLD' | null>('CORRECT');

    useEffect(() => {
        try {
            localStorage.setItem('codit-ds-tokens', JSON.stringify(tokens));
            localStorage.setItem('codit-ds-scale', JSON.stringify(scale));
        } catch {
            /* ignore */
        }
    }, [tokens, scale]);

    const vars = Object.fromEntries(
        COLOR_KEYS.map((k) => [`--${k}`, tokens[k]]),
    ) as CSSProperties;
    const previewStyle: CSSProperties = {
        ...vars,
        ['--radius' as string]: `${scale.radius / 16}rem`,
        ['--pv-shadow' as string]: SHADOWS[`${scale.shadowStrength}-${scale.shadowTint}`],
        lineHeight: scale.lh,
    };

    const cssExport = [
        ':root {',
        `    --radius: ${(scale.radius / 16).toFixed(4)}rem;`,
        ...COLOR_KEYS.map((k) => `    --${k}: ${tokens[k]}; /* ${USE_NOTE[k] ?? ''} */`),
        '}',
        `/* widget shadow: ${SHADOWS[`${scale.shadowStrength}-${scale.shadowTint}`]} */`,
        `/* body/문단 line-height: ${scale.lh} (한글) */`,
    ].join('\n');

    return (
        <div style={{ display: 'flex', gap: 20, alignItems: 'flex-start', fontFamily: 'system-ui', flexWrap: 'wrap' }}>
            <div style={{ width: 300, display: 'flex', flexDirection: 'column', gap: 14 }}>
                <div>
                    <strong style={{ fontSize: 13 }}>프리셋</strong>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5, marginTop: 6 }}>
                        {Object.keys(PRESETS).map((name) => (
                            <button
                                key={name}
                                onClick={() => setTokens({ ...CONFIRMED, ...PRESETS[name] })}
                                style={{ font: '500 11px system-ui', padding: '6px 9px', borderRadius: 999, border: '1px solid #ccc', background: '#fff', cursor: 'pointer' }}
                            >
                                {name}
                            </button>
                        ))}
                    </div>
                </div>

                <div>
                    <strong style={{ fontSize: 13 }}>형태 · 그림자 · 타이포</strong>
                    <label style={rowLabel}>radius <b>{scale.radius}px</b>
                        <input type="range" min={4} max={16} value={scale.radius} onChange={(e) => setScale((s) => ({ ...s, radius: +e.target.value }))} />
                    </label>
                    <label style={rowLabel}>위젯 여백 <b>{scale.pad}px</b>
                        <input type="range" min={10} max={22} value={scale.pad} onChange={(e) => setScale((s) => ({ ...s, pad: +e.target.value }))} />
                    </label>
                    <label style={rowLabel}>그림자 세기
                        <select value={scale.shadowStrength} onChange={(e) => setScale((s) => ({ ...s, shadowStrength: e.target.value as Scale['shadowStrength'] }))}>
                            <option value="soft">은은</option><option value="med">중간</option><option value="strong">강</option>
                        </select>
                    </label>
                    <label style={rowLabel}>그림자 색조
                        <select value={scale.shadowTint} onChange={(e) => setScale((s) => ({ ...s, shadowTint: e.target.value as Scale['shadowTint'] }))}>
                            <option value="violet">바이올렛 틴트</option><option value="gray">순수 회색</option>
                        </select>
                    </label>
                    <label style={rowLabel}>한글 줄간격 <b>{scale.lh.toFixed(2)}</b>
                        <input type="range" min={1.4} max={1.8} step={0.05} value={scale.lh} onChange={(e) => setScale((s) => ({ ...s, lh: +e.target.value }))} />
                    </label>
                </div>

                <div>
                    <strong style={{ fontSize: 13 }}>색 토큰</strong>
                    {COLOR_KEYS.map((k) => {
                        const pair = PAIRS.find((p) => p[0] === k);
                        const r = pair ? ratio(tokens[pair[0]], tokens[pair[1]]) : null;
                        return (
                            <div key={k} style={{ display: 'grid', gridTemplateColumns: '22px 1fr auto', gap: 7, alignItems: 'center', padding: '3px 0' }}>
                                <input type="color" value={tokens[k].toLowerCase()} onChange={(e) => setTokens((t) => ({ ...t, [k]: e.target.value.toUpperCase() }))} style={{ width: 22, height: 22, padding: 0, border: '1px solid #ccc', borderRadius: 5 }} />
                                <span style={{ font: '500 10.5px ui-monospace' }}>
                                    --{k}
                                    {USE_NOTE[k] && <span style={{ display: 'block', color: '#888', fontFamily: 'system-ui', fontSize: 9.5 }}>{USE_NOTE[k]}</span>}
                                </span>
                                <span style={{ font: '600 9px system-ui', color: r == null ? 'transparent' : r >= pair![2] ? '#0a7' : '#c33' }}>
                                    {r == null ? '' : `${r.toFixed(1)}${r >= pair![2] ? ' ✓' : ' ✗'}`}
                                </span>
                            </div>
                        );
                    })}
                </div>

                <div>
                    <strong style={{ fontSize: 13 }}>CSS 내보내기</strong>
                    <textarea readOnly value={cssExport} onFocus={(e) => e.currentTarget.select()} style={{ width: '100%', height: 140, font: '400 10px ui-monospace', marginTop: 5 }} />
                    <button onClick={() => { setTokens({ ...CONFIRMED }); setScale(DEFAULT_SCALE); }} style={{ font: '500 11px system-ui', marginTop: 6, padding: '5px 9px', cursor: 'pointer' }}>추천값으로 초기화</button>
                </div>
            </div>

            <div style={previewStyle}>
                <div style={{ display: 'flex', gap: 6, marginBottom: 12, flexWrap: 'wrap' }}>
                    {['타이머', '결과 선택', '메모', '태그', '저장 완료'].map((s) => (
                        <button key={s} onClick={() => setScreen(s)} style={{ font: '500 11px system-ui', padding: '5px 9px', borderRadius: 6, border: '1px solid #ccc', background: screen === s ? '#eee' : '#fff', cursor: 'pointer' }}>{s}</button>
                    ))}
                </div>

                {/* fake SWEA backdrop */}
                <div style={{ background: '#fff', border: '1px solid #dee0e3', borderRadius: 12, padding: 16, maxWidth: 420 }}>
                    <div style={{ background: '#e3edf5', color: '#334', fontSize: 12, padding: '6px 10px', borderRadius: 6, display: 'inline-block', marginBottom: 10 }}>문제 풀이</div>
                    <pre style={{ margin: 0, font: '12px/1.7 ui-monospace', color: '#292b2c' }}>
{'for (int i = 0; i < n; i++) {\n    System.out.println("#" + (i + 1));\n}'}
                    </pre>
                    <button style={{ marginTop: 10, background: '#4590e3', color: '#fff', border: 0, padding: '7px 15px', borderRadius: 6, font: '500 12px system-ui' }}>제출</button>

                    <div style={{ marginTop: 16, width: 320 }}>
                        {screen === '타이머' && <TimerScreen problemId="demo" problemTitle="1024. 최단 경로" elapsedSeconds={754} onComplete={() => {}} />}
                        {screen === '결과 선택' && <ResultSelectScreen elapsedSeconds={754} value={result} onChange={setResult} onNext={() => {}} />}
                        {screen === '메모' && (
                            <MemoScreen
                                result="CORRECT"
                                step="2 / 4"
                                memo="다익스트라로 풀었다"
                                onMemoChange={() => {}}
                                memoOpen
                                onMemoOpenChange={() => {}}
                                onBack={() => {}}
                                onNext={() => {}}
                            />
                        )}
                        {screen === '태그' && (
                            <TagSelectScreen
                                step="3 / 4"
                                coreTags={CORE_TAGS}
                                categories={TAG_CATEGORIES}
                                customTags={[]}
                                selectedTagIds={['dfs', 'greedy']}
                                onSelectedTagIdsChange={() => {}}
                                onAddCustomTag={() => {}}
                                onBack={() => {}}
                                onSave={() => {}}
                            />
                        )}
                        {screen === '저장 완료' && (
                            <SaveSuccessScreen
                                result="CORRECT"
                                elapsedSeconds={754}
                                memo="다익스트라로 풀었다"
                                tags={CORE_TAGS.slice(0, 3)}
                            />
                        )}
                    </div>
                </div>

                {/* catalog strip */}
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 18, alignItems: 'center', maxWidth: 420 }}>
                    <Button>완료</Button>
                    <Button variant="secondary">secondary</Button>
                    <Button variant="outline">뒤로</Button>
                    <Button variant="ghost">ghost</Button>
                    <Button variant="destructive">삭제</Button>
                    <Badge className="border-success bg-success text-success-foreground">정답</Badge>
                    <Badge className="border-destructive bg-destructive text-white">오답</Badge>
                    <Badge className="border-warning bg-warning text-warning-foreground">보류</Badge>
                    <div className="w-64">
                        <ResultToggleGroup value={result} onChange={setResult} />
                    </div>
                </div>
            </div>
        </div>
    );
}

const rowLabel: CSSProperties = { display: 'flex', flexDirection: 'column', gap: 3, font: '500 11px system-ui', margin: '6px 0' };

const meta: Meta<typeof Playground> = {
    title: 'Foundations/Playground',
    component: Playground,
    parameters: { layout: 'fullscreen', a11y: { test: 'off' } },
};
export default meta;
type Story = StoryObj<typeof meta>;

export const 토큰_플레이그라운드: Story = {
    render: () => (
        <div style={{ padding: 20 }}>
            <Playground />
        </div>
    ),
};
