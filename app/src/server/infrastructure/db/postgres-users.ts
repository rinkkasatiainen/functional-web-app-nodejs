import Future from "fluture";
import {Pool} from "pg";
import {executeQuery} from "../postgres/execute-query";

export const postgresUser: (x: Pool) => UserDb =
    pool => ({
        addStatistics: streamId => statistics => {
            return executeQuery(pool)(
                "SELECT streamid, age, area, relation FROM account WHERE streamid = $1")([streamId])
                .chain(e => {
                    return Future.of(e.rows);
                }).chain((rows) => {
                    if (rows.length !== 1) {
                        return Future.reject(
                            {
                                reason:
                                    `single user not found, found total of
                                    ${rows.length} entries for stream id '${streamId}'`,
                                type: "internal",
                            });
                    }
                    return Future.of(rows[0]);
                }).chain(userWithStatistics => {
                    // @ts-ignore
                    if (!userWithStatistics.age && !userWithStatistics.area && !userWithStatistics.relation) {
                        return executeQuery(pool)(
                            "UPDATE account SET  age = $1, area = $2, relation = $3 WHERE streamid = $4;")([
                            statistics.age, statistics.area, statistics.relation, streamId,
                        ]);
                    }
                    return Future.reject(
                        {
                            reason: `Cannot update statistics for stream id '${streamId}'`,
                            type: "internal",
                        });
                }).chain( e => Future.of({status: "ok", text: "Updated statistics"}));
        },
        findById: uuid => {
            return executeQuery<UserAccount>(pool)("SELECT streamid, username FROM account WHERE streamid = $1")([uuid])
                .chain(e => {
                    return Future.of(e.rows);
                }).chain((rows) => {
                    return Future.of(rows[0]);
                });
        },
        removeAccount: streamId => {
            return executeQuery(pool)
                ("DELETE FROM account WHERE streamid = $1")([streamId])
                .map( () => ({status: "ok"}));
        },
    });
