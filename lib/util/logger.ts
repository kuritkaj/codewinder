// Source: https://gist.github.com/jgautheron/044b88307d934d486f59ae87c5a5a5a0

// https://stackoverflow.com/questions/42266462/react-native-json-stringify-cannot-serialize-cyclical-structures
const getCircularReplacer = () => {
    const seen = new WeakSet();
    return (key, value) => {
        if (typeof value === "object" && value !== null) {
            if (seen.has(value)) {
                return;
            }
            seen.add(value);
        }
        return value;
    };
};

export function logError(err, extra = {}) {
    console.log("Logger: ", err?.message || err, extra);
    // don't call if on server.
    if (typeof window !== 'undefined') {
        alert(err?.message || err);
        fetch("/api/logger", {
            method: "POST",
            credentials: "same-origin",
            headers: {"Content-Type": "application/json"},
            body: JSON.stringify({
                message: err?.message || err,
                callstack: err?.stack || "",
                stamp: new Date(),
                userAgent: typeof navigator !== "undefined" ? navigator.userAgent : "server",
                ...extra,
            }, getCircularReplacer()),
        }).then();
    }
}