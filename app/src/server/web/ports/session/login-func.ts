import Future from "fluture";

export const loginFunc: Auth.LoginFunc =
    account => req => {
        // @ts-ignore
        return Future.tryP(
            () => new Promise((resolve, reject) => {
                req.logIn(account, {session: false}, (loginErr: Error) => {
                    if (loginErr) {
                        reject({type: "auth", reason: loginErr});
                    }
                    resolve(account);
                });
            }),
        );
    };
