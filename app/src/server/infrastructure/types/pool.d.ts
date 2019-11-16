import {FutureInstance} from "fluture";
import {QueryResult} from "pg";

export as namespace Db

export interface EventStream extends QueryResult {
    rows: DomainEvents.StoredEvent[];
}

interface DbUser {
    streamid: string;
    username: string;
}

export interface PoolConfig {
    database?: string;
    host: string;
    password: string;
    port: number;
    user: string;
}
