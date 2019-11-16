import Future, {FutureInstance} from "fluture";
import {Pool} from "pg";
import {debugLog} from "../../../web/routes/helpers/debug-log";

export const addAccount: (x: Pool) => (x: LoginAccount.CanLogin) => FutureInstance<Auth.LoginError, LoginAccount.User> =
    pool => ({password, username, userId: streamId}) => {
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
        return Future.tryP(registerFun)
        // tslint:disable-next-line:no-any
            .mapRej((left: any) => ({type: "login-error", reason: `Failed to add user to DB: ${left}`}));
    };
