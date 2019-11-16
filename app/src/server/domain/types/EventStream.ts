import {FutureInstance} from "fluture";

declare global {
    type StreamId = string;
    interface QuestionProjection {
        addQuestion: (id: StreamId) => FutureInstance<RepositoryError, CommandStatus>;
        numberOfOpenMessageThreads: () => FutureInstance<RepositoryError, number>;
        ensureNoQuestionFor: (id: StreamId) => FutureInstance<RepositoryError, CommandStatus>;
    }
    interface EventStream {
        // tslint:disable-next-line
        loadById: (id: StreamId) => FutureInstance<EventStoreFailure, DomainEvents.Stream>;
        // tslint:disable-next-line
        save: (id: StreamId, version: number, event: Events.DomainEvent<Events.Types, any>) => FutureInstance<any, any>;
    }
    type EventStoreFailure = DBError<"EventStoreFailure">;
    interface DBError<T> {
        type: T;
        error: string;
    }
}

export interface StreamEvent {
    streamid: string;
    version: number;
    // tslint:disable-next-line
    data: any;
    type: string;
    // tslint:disable-next-line
    meta: any;
    logdate: number;

}
