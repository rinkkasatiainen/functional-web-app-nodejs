import Future, {FutureInstance} from "fluture";
import {Pool} from "pg";

// tslint:disable-next-line:no-any
const executeQueryPromisie: (x: Pool) => (y: string) => (z: any[]) => Promise<any> =
    pool => query => async values => {
        const client = await pool.connect();
        const res = await client.query(query, values);
        client.release();
        return res;
    };

// tslint:disable-next-line:no-any
const executeQuery: (x: Pool) => (y: string) => (z: any[]) => FutureInstance<any, DomainEvents.DbStreamResult> =
    pool => query => values => {
        // @ts-ignore
        return Future.tryP(
            () => executeQueryPromisie(pool)(query)(values),
        );
    };

export const postgresEventStore: (x: Pool) => EventStream =
    pool => ({
        loadById: uuid => {
            return executeQuery(pool)("SELECT * FROM events WHERE StreamId = $1 ORDER BY version ASC")([uuid])
                .chain(e => {
                    return Future.of(e.rows);
                }).chain((rows) => {
                    return Future.of(rows.map(row => {
                        const {payload, time} = row.data;
                        return {time, type: row.type, payload};
                    }));
                });
        },
        save: (uuid, version, messageEntity) => {
            // FIXME AKS: Check that valid response is being sent, if postgres fails with query (like the one below)
            // tslint:disable-next-line:max-line-length
            // return executeQuery(pool)("INSERT INTO events(StreamId, Version, Data, Type) VALUES ($1, $2, $3, $4)")([uuid, version, messageEntity, messageEntity.type])
            // tslint:disable-next-line:max-line-length
            return executeQuery(pool)("INSERT INTO events(StreamId, Version, Data, Type, Meta) VALUES ($1, $2, $3, $4, $5)")([uuid, version, messageEntity, messageEntity.type, {}])
                .chain(e => Future.of({type: "Great Success", e}));
        },
    });
