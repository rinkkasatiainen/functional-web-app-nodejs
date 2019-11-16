
export function devDebugLog<T>(message: string, optional?: {entry: T }): void {
    const nodeenv = process.env.NODE_ENV;
    const loglevel = process.env.LOG_LEVEL;
    if (nodeenv === "test" || nodeenv === "development") {
        if (loglevel === "debug") {
            // tslint:disable-next-line:no-console
            console.log("DEVELOPMENT LOG", message, optional);
        }
    }
}
