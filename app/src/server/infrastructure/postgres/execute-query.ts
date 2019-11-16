import Future, {FutureInstance} from "fluture";
import {Pool} from "pg";

// tslint:disable-next-line:no-any
export function countOf<T>(pool: Pool): (y: string) => FutureInstance<any, number> {
    return query => {
        const func = async () => {
            const client = await pool.connect();
            const res = await client.query(query);
            client.release();
            return res;
        };
        // @ts-ignore
        return Future.tryP(
            () => func(),
        ).chain((e: {rows: T[]}) => Future.of(e.rows[0]),
        ).chain((x: {count: number}) => Future.of(x.count) );
    };
}
// tslint:disable-next-line:no-any
export function executeQuery<T>(pool: Pool): (y: string) => (z: any[]) => FutureInstance<any, { rows: T[] }> {
    return query => values => {
        const func = async () => {
            const client = await pool.connect();
            const res = await client.query(query, values);
            client.release();
            return res;
        };
        // @ts-ignore
        return Future.tryP(
            () => func(),
        );
    };
}
