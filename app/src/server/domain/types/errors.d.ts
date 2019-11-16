export interface DomainFailure<T extends DomainErrorsTypes> {
    type: T;
    reason: string;
}

// @ts-ignore
declare global {
    type UNAUTHORIZED = DomainFailure<"unauthorized">;
    type FORBIDDEN = DomainFailure<"forbidden">;
    type RUSH = DomainFailure<"forbidden">;
    type INTERNAL = DomainFailure<"internal">;
    type THREAD_CLOSED = DomainFailure<"thread-closed">;

    type DomainErrorsTypes = "unauthorized" | "forbidden" | "rush" | "internal" | "thread-closed";
}
