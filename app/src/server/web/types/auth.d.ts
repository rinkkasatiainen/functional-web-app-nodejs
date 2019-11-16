import {NextFunction, Request, Response} from "express";
import {FutureInstance} from "fluture";

export as namespace Auth

type LoginErrorsTypes = "login-error" | "username-taken" | "internal";
interface LoginErrorDetails<T extends LoginErrorsTypes> {
    type: T;
    reason: string;
}

type LoginError = LoginErrorDetails<LoginErrorsTypes>;
export interface UserAccount {
    findById: (x: StreamId) => FutureInstance<LoginError, LoginAccount.User>;
    findByUsernameAndPassword:
        (x: {username: string, password: string}) => FutureInstance<LoginError, LoginAccount.User>;
    register: (x: LoginAccount.CanLogin) => FutureInstance<LoginError, LoginAccount.User>;
    // findOne: (a: {username: string}) => FutureInstance<Failure, LoginAccount.User>;
    // findById: (id: StreamId) => FutureInstance<Failure, LoginAccount.User>;
}

export type FailureReason = string;
export type Login = (passportFunc: AuthFunc) => (loginFunc: LoginFunc)
    => (req: Request, res: Response, next: NextFunction)
    => void;

export type AuthFunc = (req: Request, res: Response, next: NextFunction) =>
    FutureInstance<LoginError, LoginAccount.User | undefined>;
export type LoginFunc = (x: LoginAccount.User) => (y: Request) =>
    FutureInstance<LoginError, LoginAccount.User>;
