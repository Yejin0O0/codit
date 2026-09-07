import type { Meta, StoryObj } from '@storybook/react-vite';

const meta: Meta = {
    title: 'Foundations/기초',
    parameters: { layout: 'fullscreen', a11y: { test: 'off' } },
};
export default meta;
type Story = StoryObj;

const COLOR_TOKENS: [string, string][] = [
    ['--background', '페이지·위젯 바탕'],
    ['--foreground', '본문·제목·타이머 숫자'],
    ['--card', '카드·위젯 표면'],
    ['--popover', '팝오버 표면'],
    ['--primary', '주요 버튼·링크·포커스링·로고'],
    ['--primary-foreground', 'primary 위 텍스트'],
    ['--secondary', 'secondary 버튼·미선택 칩'],
    ['--secondary-foreground', 'secondary 위 텍스트'],
    ['--muted', '보조 표면·스켈레톤'],
    ['--muted-foreground', "캡션·'측정 중'·날짜"],
    ['--accent', 'hover 배경'],
    ['--accent-foreground', 'accent 위 텍스트'],
    ['--border', '카드·구분선·미선택 토글'],
    ['--input', '입력창 테두리'],
    ['--ring', '포커스 링 (3px)'],
    ['--success', '정답 — 토글·배지·완료 체크'],
    ['--success-foreground', '정답 위 텍스트'],
    ['--warning', '보류 — 토글·배지'],
    ['--warning-foreground', '보류 위 텍스트'],
    ['--destructive', '오답 — 토글·배지·삭제'],
    ['--destructive-foreground', '오답 위 텍스트'],
];

const TYPE_SCALE: [string, string, string][] = [
    ['text-xs', '12px', '캡션·메타·step'],
    ['text-sm', '14px', '보조'],
    ['text-base', '14px', '본문 기본 (위젯 :host)'],
    ['text-lg', '18px', '화면 제목'],
    ['text-xl', '20px', '강조'],
    ['text-2xl', '24px', ''],
];

export const Colors: Story = {
    render: () => (
        <div className="p-8">
            <h2 className="text-muted-foreground mb-4 text-xs font-semibold tracking-widest uppercase">
                색 토큰
            </h2>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                {COLOR_TOKENS.map(([token, use]) => (
                    <div key={token} className="flex items-center gap-3 rounded-md border p-3">
                        <span
                            className="size-9 shrink-0 rounded border"
                            style={{ background: `var(${token})` }}
                        />
                        <span className="min-w-0">
                            <code className="block text-xs font-medium">{token}</code>
                            <span className="text-muted-foreground block text-[11px]">{use}</span>
                        </span>
                    </div>
                ))}
            </div>
        </div>
    ),
};

export const Typography: Story = {
    render: () => (
        <div className="p-8">
            <h2 className="text-muted-foreground mb-4 text-xs font-semibold tracking-widest uppercase">
                타입 스케일 · 시스템 폰트
            </h2>
            <div className="flex flex-col gap-4">
                {TYPE_SCALE.map(([cls, px, use]) => (
                    <div key={cls} className="flex items-baseline gap-4 border-b pb-3">
                        <code className="text-muted-foreground w-24 shrink-0 text-xs">{cls}</code>
                        <span className={cls}>다람쥐 헌 쳇바퀴에 타고파 Codit</span>
                        <span className="text-muted-foreground ml-auto text-xs">
                            {px} {use && `· ${use}`}
                        </span>
                    </div>
                ))}
            </div>
            <p className="text-muted-foreground mt-6 max-w-[60ch] text-sm leading-relaxed">
                한글 문단 line-height 1.6. 시스템 스택 — 웹폰트 미도입(확장·오프라인·Shadow DOM).
                Extension Page 텍스트 컬럼은 45–75자.
            </p>
        </div>
    ),
};
