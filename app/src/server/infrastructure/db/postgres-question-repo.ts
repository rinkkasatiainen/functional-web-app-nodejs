import Future from "fluture";
import {Pool} from "pg";
import {countOf, executeQuery} from "../postgres/execute-query";

// tslint:disable-next-line:no-any
const executeQueryPromisie: (x: Pool) => (y: string) => (z: any[]) => Promise<any> =
    pool => query => async values => {
        const client = await pool.connect();
        const res = await client.query(query, values);
        client.release();
        return res;
    };

export const postgresQuestionRepo: (x: Pool) => QuestionProjection =
    pool => ({
        addQuestion: (streamId) => {
            // @ts-ignore
            return Future.tryP(
                () => executeQueryPromisie(pool)("INSERT INTO question (streamid) VALUES ($1)")([streamId])
                .then(() => {
                    return 201;
                })
                .catch( (err) => {
                    return 200;
                }),
            );
        },
        ensureNoQuestionFor: (streamId) => {
            return executeQuery(pool)("DELETE FROM question WHERE streamId = $1")([streamId])
                .map(() => ({status: "ok"}) );
        },
        numberOfOpenMessageThreads: () => {
            return countOf(pool)("SELECT count(*) FROM question WHERE threadCount = 1")
                .chain(rows => {
                    return Future.of(rows);
                });
        },
    });
