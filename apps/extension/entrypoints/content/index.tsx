import { mountCoditWidget } from './mount';

export default defineContentScript({
    // Codit 의 대상은 SWEA. 실제 위젯 mount 여부는 mountCoditWidget 이
    // contestProbId 유무로 판단한다 (문제 페이지가 아니면 아무것도 하지 않는다).
    matches: ['*://swexpertacademy.com/*', '*://*.swexpertacademy.com/*'],

    main() {
        mountCoditWidget();
    },
});
