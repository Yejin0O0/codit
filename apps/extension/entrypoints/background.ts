export default defineBackground(() => {
    console.log('Codit background running', { id: browser.runtime.id });
});
