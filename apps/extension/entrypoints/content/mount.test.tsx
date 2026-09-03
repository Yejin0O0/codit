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
    it('should not create any DOM when the page has no contestProbId', () => {
        const childCountBefore = document.body.childElementCount;

        const mounted = mountCoditWidget(NON_PROBLEM_URL);

        expect(mounted).toBe(false);
        expect(document.getElementById('codit-root')).toBeNull();
        expect(document.body.childElementCount).toBe(childCountBefore);
    });

    it('should mount a shadow-DOM widget root on a SWEA problem page', () => {
        const mounted = mountCoditWidget(PROBLEM_URL);

        expect(mounted).toBe(true);
        const root = document.getElementById('codit-root');
        expect(root).not.toBeNull();
        expect(root!.shadowRoot).not.toBeNull();
    });

    it('should not mount a second time when a root already exists', () => {
        mountCoditWidget(PROBLEM_URL);
        const mountedAgain = mountCoditWidget(PROBLEM_URL);

        expect(mountedAgain).toBe(false);
        expect(document.querySelectorAll('#codit-root')).toHaveLength(1);
    });
});
