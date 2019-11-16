import {FutureInstance} from "fluture";
import {QueryResult} from "pg";
import {StreamEvent} from "./EventStream";

export as namespace DomainEvents

// TODO AkS: Wrong declaration file?
// tslint:disable-next-line:no-any
export type Stream = Array<Events.DomainEvent<Events.Types, any>>;
export interface StreamIdAndEvents {
    id: StreamId; events: Stream;
}
export type ListOfStreams = StreamIdAndEvents[];

interface DbStreamResult extends QueryResult {
    rows: StoredEvent[];
}

export interface StoredEvent {
    // tslint:disable-next-line:no-any
    data: any;
    logdate: string;
    // tslint:disable-next-line:no-any
    meta: any;
    streamid: StreamId;
    type: Events.Types;
    version: number;
}
