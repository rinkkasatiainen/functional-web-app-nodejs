import {compare, genSalt, hash} from "bcrypt";
import Future, {FutureInstance} from "fluture";
import {Pool} from "pg";

import {devDebugLog} from "../../helpers/development-debug";
import {debugLog} from "../../web/routes/helpers/debug-log";
import {executeQuery} from "../postgres/execute-query";
import {addAccount} from "./functions/add-account";
import {findOneByUsername} from "./functions/find-one-by-username";

const USENAME_TAKEN: Auth.LoginError = {type: "username-taken", reason: "Käyttäjänimi on jo varattu"};

const comparePassword:
    (x: {username: string, password: string})
        => (y: LoginAccount.CanLogin) => FutureInstance<Failure, LoginAccount.User> =
    ({username, password}) => userFromDb => {
        // @ts-ignore
        return Future.tryP(() => new Promise((resolve, reject) => {
            compare(getPassword(username, password), userFromDb.password, (err: Error, isMatch: boolean) => {
                    if (err) {
                        reject({status: "internal", reason: err.message});
                    }
                    if (!isMatch) {
                        reject({status: "unauthorized", reason: "Käyttäjdänimi tai salasana on virheellinen"});
                    }
                    const {userId} = userFromDb;
                    devDebugLog("Logged in as", {entry: {userId, username}});
                    resolve({userId, username});
                });
            }),
        );
    };

export const getPassword: (username: string, password: string)  => string =
    (username, password) => `${username}--${password}`;

const buildSalted: (x: { username: string, password: string }) => FutureInstance<Auth.LoginError, string> =
    // @ts-ignore
    ({username, password}) => Future.tryP(
        () => buildSalt(getPassword(username, password)),
    );

// accountSchema.methods.comparePassword = comparePassword;

const buildSalt = async (password: string) => new Promise(((resolve, reject) => {
    genSalt(10, (err, salt) => {
        if (err) {
            return reject(err);
        }
        hash(password, salt, (errHash: Error, h: string) => {
            if (err) {
                return reject(errHash);
            }
            devDebugLog("created hash", {entry: {hash: h}});
            resolve(h);
        });
    });
}));
const findByIdQuery: (x: Pool) => (y: StreamId) => FutureInstance<RepositoryError, LoginAccount.User>
    = pool => uuid => {
    // tslint:disable-next-line:no-any
    return executeQuery<any>(pool)(`
            SELECT streamid, username, password
            FROM account
            WHERE streamid = $1`)([uuid])
        .chain(e => {
            return Future.of(e.rows);
        }).chain((rows) => {
            if (rows.length === 0) {
                return Future.reject({type: "AUTHENTICATION ERROR", reason: `USER '${uuid}' NOT FOUND`});
            }
            const row = rows[0];
            return Future.of({
                userId: uuid,
                username: row.username,
            });
        });
};

const LOGIN_ERROR: Auth.LoginError = {type: "login-error", reason: "Käyttäjänimi tai salasana on virheellinen"};
const postgresUser: (x: Pool) => Auth.UserAccount =
    pool => ({
        findById: uuid => findByIdQuery(pool)(uuid)
            .mapRej(() => LOGIN_ERROR),
        findByUsernameAndPassword: ({username, password}) => {
            const findOneFun: () => Promise<LoginAccount.CanLogin> = () => pool.connect()
                .then(client =>
                    client.query(`
                        SELECT streamid, username, password
                        FROM account
                        WHERE username = $1
                        `, [username])
                        .then(res => {
                            if (res.rowCount === 0) {
                                throw new Error("No users found");
                            }
                            client.release();
                            return {userId: res.rows[0].streamid, username, password: res.rows[0].password};
                        })
                        .catch(err => {
                            debugLog("Error on loginAs", {entry: err});
                            return err;
                        }),
                );
            // tslint:disable:no-any
            // @ts-ignore
            const futureUser = Future.tryP(findOneFun) as FutureInstance<any, VerifyAuth>;
            // tslint:enable:no-any
            return futureUser.chain(
                comparePassword({username, password}),
            ).mapRej(() => LOGIN_ERROR);
        },
        register: ({userId, username, password}) => {
            return (findOneByUsername(pool)(username)
                .swap() as FutureInstance<LoginAccount.User, Failure>)
                .mapRej(() => USENAME_TAKEN)
                .and(buildSalted({username, password}))
                .chain(saltedPassword => addAccount(pool)({userId, username, password: saltedPassword}))
                ;
        },

    });

// @ts-ignore
/*
const postgresUserOld: (x: Pool) => Db.UserAccount =
// @ts-ignore
    pool => ({
// @ts-ignore
        build: ({userId, username, password}) => {
            ( findOneByUsername(pool)(username).swap() as FutureInstance<LoginAccount.User, Failure>)
                .mapRej( () => ({ type: "username-taken", reason: "Käyttäjänimi on jo varattu"}))
                .and( buildSalted({username, password}) )
                .chain(
                // @ts-ignore
                userAccount.register,
            ).mapRej(
                (l: RepositoryError) => ({reason: l.reason, type: "internal"}),
            );
            // @ts-ignore
            const future = Future.tryP(() => buildSalt(password)) as FutureInstance<Error, string>;
            return future.map(
                saltedPassword => ({userId, username, password: saltedPassword}),
                // tslint:disable-next-line:no-any
            ) as FutureInstance<any, any>;
        },
        findById: streamid => {
            const findOneFun: () => Promise<LoginAccount.User> = () => pool.connect()
                .then(client =>
                    client.query("SELECT streamid, username, password FROM account WHERE streamid = $1", [streamid])
                        .then(res => {
                            client.release();
                            const {streamid: userId, username} = res.rows[0];
                            return {userId, username} as LoginAccount.User;
                        }).catch(err => {
                        debugLog("Error on findById", {entry: err});
                        return err;
                    }),
                );
            // @ts-ignore
            return Future.tryP(findOneFun);
        },

            // @ts-ignore
        findOne: ({username}) => {
            const findOneFun: () => Promise<LoginAccount.User> = async () => {
                const client = await pool.connect();
                const res = await client.query(
                    "SELECT streamId, username FROM account WHERE username = $1", [username],
                );
                client.release();
                return {userId: res.rows[0].streamId, username};
            };
            // @ts-ignore
            return Future.tryP(findOneFun);
        },
            // @ts-ignore
        loginAs: ({username, password}) => {
            const findOneFun: () => Promise<LoginAccount.CanLogin> = () => pool.connect()
                .then(client =>
                    client.query("SELECT streamid, username, password FROM account WHERE username = $1", [username])
                        .then(res => {
                            client.release();
                            return {userId: res.rows[0].streamid, username, password: res.rows[0].password};
                        })
                        .catch(err => {
                            debugLog("Error on loginAs", {entry: err});
                            return err;
                        }),
                );
            // tslint:disable:no-any
            // @ts-ignore
            const futureUser = Future.tryP(findOneFun) as FutureInstance<any, LoggableUserAccount>;
            // tslint:enable:no-any
            return futureUser.chain(
                comparePassword(password),
            ).mapRej(x => ({...x, type: "FIXME"}));
        },
        register: (userAccountModel: LoginAccount.CanLogin) => {
            const {password, username, userId: streamId} = userAccountModel;
            const registerFun = () => pool.connect()
                .then(client => {
                    return client.query(
                        "INSERT INTO account(streamid, password, username) VALUES( $1, $2, $3 )",
                        [streamId, password, username],
                    )
                        .then(res => {
                            client.release();
                            return {done: "ok"};
                        })
                        .catch(err => {
                            client.release();
                            debugLog("Error in register", {entry: err});
                            return {err};
                        });
                });

            // @ts-ignore
            return Future.tryP(registerFun);
        },
    });
*/

export const model: (x: Pool) => Auth.UserAccount = postgresUser;
