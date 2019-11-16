import {Request, Response} from "express";
import * as S from "sanctuary";

import {executeEither, handle} from "../result/handle-future";
import {logEntry} from "../result/log-entry";
import {redirectOnSuccess, redirectTo} from "../result/redirect-to";
import {reportErrors} from "../result/report-errors";
import {isAuthenticated} from "../validators/is-logged-in";

// TODO AkS: Type is wrong
const mapToSuccess: (x: LoginAccount.User) => Success<LoginAccount.User> =
    response => ({value: response, reason: "200"});

export const redirectToUsersOwnMessage = (req: Request, res: Response) => {
    const user = req.user as LoginAccount.User;
    const handleResponse1 = executeEither<LoginAccount.User>({req, res});

    const onError = handle([
        redirectTo("/auth/login"),
        reportErrors,
    ]);

    const onSuccess = handle<LoginAccount.User>([
        logEntry,
        redirectOnSuccess<LoginAccount.User>(e => `/question/${e.userId}`),
    ]);

    const response: Either<Failure, LoginAccount.User> =
        S.ap(S.Right(mapToSuccess))(isAuthenticated(user)) as Either<Failure, LoginAccount.User>;
    handleResponse1(onError)(onSuccess)(response);
};
