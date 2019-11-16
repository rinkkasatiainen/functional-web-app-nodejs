import {NextFunction, Request, Response} from "express";
import {FutureInstance} from "fluture";
import {authFunc} from "./auth-func";
import {login} from "./login";
import {loginFunc} from "./login-func";

const doRegister:
    (x: Auth.UserAccount) =>
        (y: LoginAccount.CanLogin) =>
            FutureInstance<Auth.LoginError, LoginAccount.User> =
    userAccount => ({userId, username, password}) => {
        return userAccount.register({userId, username, password});
    };

const register = (userAccount: Auth.UserAccount) => async (req: Request, res: Response, next: NextFunction) => {
    const {params, body} = req;
    const {uuid} = params;
    const {password, username} = body;

    const future = doRegister(userAccount)({userId: uuid, password, username});

    future.fork(
        error => {
            res.json({status: "400", error});
        },
        resolve => {
            next();
        },
    );
};

const authenticate = () => (req: Request, res: Response, next: NextFunction) => {
    // first check if the user is authenticated
    if (req.isAuthenticated()) {
        next(); // carry on! They are logged in!
        return;
    }
    res.json({status: 401, reason: "not authenticated"});
    res.redirect("/auth/login");
};

type AddModelToAuthenticate = (x: Auth.UserAccount) => Server.Authenticate;

export const authenticateSession: AddModelToAuthenticate =
    accounts => ({
        authenticate,
        login: login(authFunc)(loginFunc),
        register: register(accounts),
    });
