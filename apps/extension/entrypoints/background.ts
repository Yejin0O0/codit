export default defineBackground(() => {
    console.log('Codit background running', { id: browser.runtime.id });

    // content script(비신뢰 컨텍스트)가 chrome.storage.session 에 접근할 수 있게 한다.
    // (timer-persistence prd ADR-2) — idempotent, 여러 번 불려도 안전.
    browser.storage.session.setAccessLevel({ accessLevel: 'TRUSTED_AND_UNTRUSTED_CONTEXTS' }).catch(() => {});
});
