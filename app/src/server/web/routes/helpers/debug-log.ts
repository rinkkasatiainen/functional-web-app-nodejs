
export type DebugLog<T> = (message: string, optional?: {entry: T} ) => void;

export function debugLog<T>( message: string, optional?: {entry: T }): void {
    const loglevel = process.env.LOG_LEVEL;
    if (loglevel === "info") {
        // tslint:disable-next-line
        console.log(message, optional);
    }
}
