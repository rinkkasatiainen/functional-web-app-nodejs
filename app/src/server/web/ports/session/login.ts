import {LoginErrorDetails, LoginErrorsTypes} from "auth";
import {NextFunction, Request, Response} from "express";
import Future, {FutureInstance} from "fluture";
import {sign} from "jsonwebtoken";
import {secret} from "../secret";

const jwtSign: (u: LoginAccount.User) => string =
    (user) => {
        const {userId, username} = user;
        return jwtToken({_id: userId, username});
    };
export interface JwtToken {
    _id: string;
    username: string;
}
const jwtToken: (t: JwtToken) => string =
    ({_id: id, username}) => sign({
        id,
        username,
    }, secret, {
        expiresIn: 60 * 3, // 3 miinutess
    });

export const LOGIN_REQUIRES_AUTHENTICATION = "requires authentication";
export const LOGIN_FAILED_REQUIRES_AUTHENTICATION: LoginErrorDetails<"login-error"> = {
        reason: LOGIN_REQUIRES_AUTHENTICATION,
        type: "login-error",
    };

type LoginErrorType = LoginErrorDetails<LoginErrorsTypes>;
const verifyLogin: (x?: LoginAccount.User) => FutureInstance<LoginErrorType, LoginAccount.User> =
    account => {
        if (account) {
            return Future.of(account);
        }
        return Future.reject(LOGIN_FAILED_REQUIRES_AUTHENTICATION);
    };

export const login: Auth.Login =
    authtFunc => loginFunc => (req: Request, res: Response, next: NextFunction) => {
        const result = authtFunc(req, res, next)
            .chain(verifyLogin)
            .chain((account) => loginFunc(account)(req)) as FutureInstance<LoginErrorType, LoginAccount.User>;

        result.fork(
            (error) => {
                res.json({status: "error", error});
            },
            (user) => {
                const token = jwtSign(user);
                res.json({status: "ok", token});
            },
        );
    };
