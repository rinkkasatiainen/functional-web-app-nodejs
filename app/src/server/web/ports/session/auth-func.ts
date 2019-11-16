import Future from "fluture";
import {authenticate as passportAuth} from "passport";
import {IVerifyOptions} from "passport-local";

export const authFunc: Auth.AuthFunc =
    (req, res, next) => {
        // @ts-ignore
        return Future.tryP(
            () => new Promise((resolve, reject) => {
                passportAuth("local", (err: Error, account: LoginAccount.User, info: IVerifyOptions) => {
                    if (err) {
                        return reject({type: "auth", reason: err});
                    }
                    if (!account) {
                        return reject({type: "auth", reason: info.message});
                    }
                    return resolve(account);
                })(req, res, next);
            }),
        );
    };
