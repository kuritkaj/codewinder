export function debounce(func: (...args: any) => void, delayms: number) {
    let debounceTimer: any;
    return function () {
        const context = this;
        const args = arguments;
        clearTimeout(debounceTimer);
        debounceTimer = setTimeout(() => func.apply(context, args), delayms);
    }
}