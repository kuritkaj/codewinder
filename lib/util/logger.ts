// Source: https://gist.github.com/jgautheron/044b88307d934d486f59ae87c5a5a5a0

// https://stackoverflow.com/questions/42266462/react-native-json-stringify-cannot-serialize-cyclical-structures
const getCircularReplacer = () => {
    const seen = new WeakSet();
    return (_key: string, value: any) => {
        if (typeof value === "object" && value !== null) {
            if (seen.has(value)) {
                return;
            }
            seen.add(value);
        }
        return value;
    };
};

export function logError(err: Error | string, extra = {}) {
    // @ts-ignore
    const message = err?.message || err;
    // @ts-ignore
    const stack = err?.stack || "";
    console.log("Logger: ", message, extra);
    // don't call if on server.
    if (typeof window !== 'undefined') {
        // @ts-ignore
        alert(err?.message || err);
        fetch("/api/logger", {
            method: "POST",
            credentials: "same-origin",
            headers: {"Content-Type": "application/json"},
            body: JSON.stringify({
                message: message,
                callstack: stack,
                stamp: new Date(),
                userAgent: typeof navigator !== "undefined" ? navigator.userAgent : "server",
                ...extra,
            }, getCircularReplacer()),
        }).then();
    }
}