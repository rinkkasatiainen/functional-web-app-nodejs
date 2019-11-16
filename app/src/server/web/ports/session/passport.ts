import {Application} from "express";
import {use as passportUse} from "passport";
import {ExtractJwt, Strategy as JWTStrategy} from "passport-jwt";
import {Strategy as LocalStrategy, VerifyFunction} from "passport-local";
import {Pool} from "pg";

import {model} from "../../../infrastructure/db/UserAccount";
import {secret} from "../secret";

type DoneCallback<T> = (err: (Error | undefined), x?: T) => void;

const loginAsUserVerifyStrategy: (x: Auth.UserAccount) => VerifyFunction =
    userAccount => (username, password, done) => {
        const futureResult = userAccount.findByUsernameAndPassword({username, password});
        futureResult.fork(
            reject => {
                done(reject, null);
            },
            resolve => {
                done(null, resolve);
            },
        );
    };

export const passportConfig: (x: Pool) => (y: Application) => void =
    pool => {
        const storedUserAccount = model(pool);
        passportUse(
            new LocalStrategy({
                passwordField: "password",
                session: false,
                usernameField: "username",
            }, loginAsUserVerifyStrategy(storedUserAccount)),
        );
        passportUse(new JWTStrategy({
                jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
                secretOrKey: secret,
            },
            // tslint:disable-next-line:no-any
            ((jwtPayload: { id: string }, cb: DoneCallback<any | null>) => {
                    storedUserAccount.findById(jwtPayload.id).fork(
                        reject => {
                            cb({name: reject.type, message: reject.reason}, null);
                        },
                        user => {
                            cb(undefined , user);
                        },
                    );
                }
            ),
        ));
        // const timeout4Hours = 4 * 60 * 60 * 1000;

        return app => {
            // app.use(initialize());
        };

        // Flashes
        // TODO AkS: provide this as a dependency inversion
        // app.use(flash())

        // passport.serializeUser<LoginAccount.User, string>
        // ((user: LoginAccount.User, done: DoneCallback<string>): void => {
        //     console.log("serialize user ", user)
        //     done(undefined, user.userId);
        // });
        //
        // passport.deserializeUser<LoginAccount.User, string>((id: string, done: DoneCallback<LoginAccount.User>) => {
        //     console.log("deserialize user ", id)
        //     const future = storedUserAccount.findById(id);
        //
        //
        //     future.fork(
        //         reject => {
        //             if (reject.type === "login-error") {
        //                 done(undefined, undefined);
        //                 return;
        //             }
        //             debugLog("Failing to deserialize user!", {entry: reject});
        //             done({name: reject.type, message: reject.reason}, undefined);
        //         },
        //         user => {
        //             done(undefined, {userId: user.userId, username: user.username});
        //         },
        //     );
        // });
    };
