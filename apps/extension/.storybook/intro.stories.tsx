import type { Meta, StoryObj } from '@storybook/react-vite';

/**
 * Codit 디자인 시스템 Storybook — 사용 안내.
 * `/design-system` Phase 2: 이 Storybook에서 토큰을 정한다.
 */
const meta: Meta = {
    title: '시작하기',
    parameters: { layout: 'fullscreen', a11y: { test: 'off' } },
};
export default meta;
type Story = StoryObj;

const card: React.CSSProperties = {
    border: '1px solid #e3dfea',
    borderRadius: 12,
    padding: '16px 18px',
    background: '#fff',
};

export const 안내: Story = {
    name: '읽어주세요',
    render: () => (
        <div
            style={{
                maxWidth: 760,
                margin: '0 auto',
                padding: '40px 24px 80px',
                font: '14px/1.6 -apple-system, "Segoe UI", "Malgun Gothic", sans-serif',
                color: '#1a1523',
            }}
        >
            <h1 style={{ fontSize: 22, margin: '0 0 4px' }}>Codit 디자인 시스템</h1>
            <p style={{ color: '#65636e', margin: '0 0 28px' }}>
                지금 상태 = shadcn <code>neutral</code> 무채색. 리스킨 전. 여기서 새 토큰을 정한다.
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                <div style={card}>
                    <strong>1. 현재 상태 훑어보기</strong>
                    <p style={{ margin: '6px 0 0', color: '#3a3d4f' }}>
                        왼쪽 트리 <b>Primitives · Codit · Widget/화면</b> — 지금 UI가 왜 밋밋한지 확인.
                        각 스토리 하단 <b>Accessibility</b> 탭에서 대비 자동 점검(axe).
                    </p>
                </div>

                <div style={card}>
                    <strong>2. Foundations → Playground 에서 토큰 조정</strong>
                    <p style={{ margin: '6px 0 8px', color: '#3a3d4f' }}>
                        실제 위젯 화면 5개 + 컴포넌트 위에서 실시간 반영. 판단할 노브:
                    </p>
                    <table style={{ borderCollapse: 'collapse', fontSize: 13, width: '100%' }}>
                        <tbody>
                            {[
                                ['프리셋', 'Radix 기반(추천) / primary 진하게·파랑 / 구분 더 강하게 / 현재'],
                                ['색 토큰', '스와치 클릭(피커) 또는 hex 직접 입력. fg/bg 쌍은 대비 ✓/✗ 표시'],
                                ['radius', '4–16px. 카드·버튼 모서리 (추천 10)'],
                                ['위젯 여백', '10–22px (추천 16)'],
                                ['그림자', '세기(은은/중간/강) + 색조(바이올렛 틴트/회색). SWEA 흰 배경서 떠 보이나'],
                                ['한글 줄간격', '1.4–1.8 (추천 1.6)'],
                            ].map(([a, b]) => (
                                <tr key={a} style={{ borderTop: '1px solid #eee' }}>
                                    <td style={{ padding: '7px 10px 7px 0', fontWeight: 600, whiteSpace: 'nowrap', verticalAlign: 'top' }}>
                                        {a}
                                    </td>
                                    <td style={{ padding: '7px 0', color: '#3a3d4f' }}>{b}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                <div style={card}>
                    <strong>3. 각 화면에서 확인할 것</strong>
                    <ul style={{ margin: '6px 0 0', paddingLeft: 18, color: '#3a3d4f' }}>
                        <li>타이머 — "완료" 버튼이 SWEA 파랑 제출버튼과 구분되나</li>
                        <li>결과 선택 — 정답(초록)/오답(빨강)/보류(노랑) + 미선택이 서로 확실히 구분되나</li>
                        <li>메모 — 입력창 테두리가 "입력하는 곳"으로 읽히나</li>
                        <li>태그 — 선택 칩(violet) vs 미선택 칩(회색)</li>
                        <li>전체 — 카드가 배경에서 떠 있나, 밋밋하지 않나</li>
                    </ul>
                </div>

                <div style={{ ...card, background: '#f1eefe', borderColor: '#c9bdf0' }}>
                    <strong>4. 정했으면</strong>
                    <p style={{ margin: '6px 0 0', color: '#3a3d4f' }}>
                        Playground 왼쪽 위 <b>"CSS 복사"</b> 버튼 → Claude에게 붙여넣기.
                        <br />
                        또는 말로: <i>"추천대로"</i> / <i>"radius 8, 그림자 회색, 뒤로 버튼 ghost"</i>.
                    </p>
                </div>
            </div>

            <p style={{ marginTop: 28, color: '#65636e', fontSize: 12 }}>
                이후: Claude가 <code>prd.md</code> ADR 확정 → Phase 3 승인 → Phase 4 (<code>tokens.css</code> 재작성 →
                컴포넌트 리스킨). 레이아웃 재설계는 별도(화면별 <code>/fe-ui-design</code>).
            </p>
        </div>
    ),
};
