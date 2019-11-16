import Future, {FutureInstance} from "fluture";
import {Pool} from "pg";
import v4 = require("uuid/v4");

import {UuidProvider} from "../domain/actions/action";
import {StreamId} from "../domain/actions/streamId";

// tslint:disable-next-line:no-any
// tslint:disable-next-line:no-any
const executeQueryAsPromise: (x: Pool) => (y: string) => (z: any[]) => Promise<any> =
    pool => query => async values => {
        const client = await pool.connect();
        const res = await client.query(query, values);
        client.release();
        return res;
    };

// tslint:disable-next-line:no-any
const queryX: (x: Pool) => (y: string) => (z: any[]) => FutureInstance<string, StreamId> =
    pool => query => values => {
        // @ts-ignore
        return Future.tryP(
            () => executeQueryAsPromise(pool)(query)(values),
        ).mapRej(
            () => ({status: 300, number: 2}),
        );
    };

export const uuidProvider: (x: Pool) => UuidProvider =
    poolInstance => () => {

        const uuid = v4();
        return queryX(poolInstance)("INSERT INTO streamIds(streamId) VALUES($1)")([uuid])
            .bimap(
                () => "Failed to create a stream",
                () => ({uuid}) );
    };
