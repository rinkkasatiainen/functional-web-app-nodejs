import {Message} from "../message";

declare global {
    interface DomainError {
        type: string;
    }
    interface DomainEntity {
        version: number;
        streamId: StreamId;
    }
}
