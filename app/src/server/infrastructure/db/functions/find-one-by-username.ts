import Future, {FutureInstance} from "fluture";
import {Pool} from "pg";
import {executeQuery} from "../../postgres/execute-query";

export const findOneByUsername: (x: Pool) => (x: string) => FutureInstance<RepositoryError, LoginAccount.User> =
    pool => username =>
        executeQuery<Db.DbUser>(pool)("SELECT streamId, username FROM account WHERE username = $1")([username])
            .mapRej(
                left => ({type: "repository", reason: `Error in retrieving details, 'left'`}),
            )
            .chain(res => Future.of(res.rows))
            .chain(rows => {
                if (rows.length !== 1) {
                    return Future.reject({
                        reason: `Did not find only 1 user by username: found total of ${rows.length}`,
                        type: "repository",
                    }) as FutureInstance<RepositoryError, Db.DbUser>;
                }
                return Future.of(rows[0]);
            }).chain(dbUser => Future.of({username: dbUser.username, userId: dbUser.streamid}));
