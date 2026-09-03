import { afterEach, describe, expect, it, vi } from 'vitest';

// 번들 CSS(Tailwind @import) 는 이 단위 테스트의 관심사가 아니다.
vi.mock('./style.css?inline', () => ({ default: ':host { display: block; }' }));

import { mountCoditWidget } from './mount';

const PROBLEM_URL =
    'https://swexpertacademy.com/main/code/problem/problemDetail.do?contestProbId=AZ8R8haaeYnHBITH';
const NON_PROBLEM_URL = 'https://swexpertacademy.com/main/main.do';

afterEach(() => {
    document.body.innerHTML = '';
});

describe('mountCoditWidget', () => {
    it('contestProbId가 없으면 DOM을 만들지 않는다', () => {
        const childCountBefore = document.body.childElementCount;

        const mounted = mountCoditWidget(NON_PROBLEM_URL);

        expect(mounted).toBe(false);
        expect(document.getElementById('codit-root')).toBeNull();
        expect(document.body.childElementCount).toBe(childCountBefore);
    });

    it('SWEA 문제 페이지에서는 Shadow DOM 위젯 root를 mount한다', () => {
        const mounted = mountCoditWidget(PROBLEM_URL);

        expect(mounted).toBe(true);
        const root = document.getElementById('codit-root');
        expect(root).not.toBeNull();
        expect(root!.shadowRoot).not.toBeNull();
    });

    it('root가 이미 있으면 다시 mount하지 않는다', () => {
        mountCoditWidget(PROBLEM_URL);
        const mountedAgain = mountCoditWidget(PROBLEM_URL);

        expect(mountedAgain).toBe(false);
        expect(document.querySelectorAll('#codit-root')).toHaveLength(1);
    });
});
