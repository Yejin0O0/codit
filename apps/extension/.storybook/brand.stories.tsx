import type { Meta, StoryObj } from '@storybook/react-vite';

import { BrandHeader } from '@/components/codit/brand-header';

/**
 * 브랜드 자산. 원본 = `docs/ui/brand/` (SoT). 사용 맵·색·규격은 `docs/ui/brand/README.md`.
 * 인앱 인라인 SVG(BrandHeader·CollapsedTimer)는 아직 placeholder 마름모 — Phase 4f에서
 * stroke C 옥타곤 + 민트 체크로 트레이스한다.
 */
const meta: Meta = {
    title: 'Foundations/브랜드',
    parameters: { layout: 'padded', a11y: { test: 'off' } },
};
export default meta;
type Story = StoryObj;

const box: React.CSSProperties = {
    border: '1px solid #e3dfea',
    borderRadius: 12,
    padding: 20,
    background: '#fff',
};

export const 로고: Story = {
    render: () => (
        <div style={{ maxWidth: 720, display: 'flex', flexDirection: 'column', gap: 16, font: '14px/1.6 system-ui' }}>
            <div style={box}>
                <h3 style={{ margin: '0 0 12px', fontSize: 13, color: '#65636e', textTransform: 'uppercase', letterSpacing: '.06em' }}>
                    원본 (docs/ui/brand/)
                </h3>
                <div style={{ display: 'flex', gap: 24, alignItems: 'center', flexWrap: 'wrap' }}>
                    <img src="/brand/mark.png" alt="Codit 마크" width={96} height={96} style={{ borderRadius: 18 }} />
                    <img src="/brand/lockup.png" alt="Codit 락업" style={{ height: 72 }} />
                </div>
                <p style={{ margin: '12px 0 0', color: '#65636e', fontSize: 12 }}>
                    렌더된 그라데이션 래스터. 확장 아이콘·파비콘·문서엔 그대로, 제품 UI 안에선 인라인 SVG로 트레이스.
                </p>
            </div>

            <div style={box}>
                <h3 style={{ margin: '0 0 12px', fontSize: 13, color: '#65636e', textTransform: 'uppercase', letterSpacing: '.06em' }}>
                    확장 아이콘 (public/icon/) — 교체 완료
                </h3>
                <div style={{ display: 'flex', gap: 16, alignItems: 'flex-end' }}>
                    {[16, 32, 48, 96, 128].map((s) => (
                        <span key={s} style={{ textAlign: 'center' }}>
                            <img src={`/icon/${s}.png`} alt={`${s}px`} width={s} height={s} />
                            <span style={{ display: 'block', fontSize: 10, color: '#888' }}>{s}</span>
                        </span>
                    ))}
                </div>
            </div>

            <div style={{ ...box, borderColor: '#f0c8c8', background: '#fdf3f3' }}>
                <h3 style={{ margin: '0 0 12px', fontSize: 13, color: '#a94442', textTransform: 'uppercase', letterSpacing: '.06em' }}>
                    인앱 인라인 SVG — 아직 placeholder (Phase 4f 교체 대상)
                </h3>
                <div style={{ display: 'flex', gap: 24, alignItems: 'center' }}>
                    <BrandHeader variant="full" />
                    <BrandHeader variant="compact" />
                </div>
                <p style={{ margin: '12px 0 0', color: '#a94442', fontSize: 12 }}>
                    마름모 ▷◁ = placeholder. 목표: stroke C(라운드 옥타곤 트레이스) + 민트 체크,
                    워드마크는 그라데이션 텍스트. pill은 16px 단색.
                </p>
            </div>
        </div>
    ),
};
