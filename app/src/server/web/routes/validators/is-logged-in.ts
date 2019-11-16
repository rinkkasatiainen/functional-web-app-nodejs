import * as S from "sanctuary";

import {Result} from "../../../domain/actions/action";
import {toMaybe} from "../../../helpers/sanctuary/toMaybe";
import {toError} from "../helpers/to-error";
import {toEither} from "../../../helpers/sanctuary/toEither";

export const isAuthenticated: (a?: LoginAccount.User) => Result<LoginAccount.User> =
    maybeUser => toEither(toError("unauthorized")("you need to login to open the page") )(maybeUser);

export const isAuthorized: (page: string) => (y?: LoginAccount.User) => Result<LoginAccount.User>  =
    page => user => {
        const pageUuid = toMaybe<string>(page);
        const userMaybe = toMaybe<LoginAccount.User>(user);
        // const userUuid = S.maybe("foo")(S.prop("userId"))(user);
        const userUuid = S.map(S.prop("userId"))(userMaybe);
        const isAuthorizedMaybe: Maybe<LoginAccount.User> =
            S.equals(userUuid)(pageUuid) ? userMaybe : S.Nothing;

        return S.maybeToEither(toError("forbidden")("user.not.allowed.to.open.stream"))(isAuthorizedMaybe);
    };
