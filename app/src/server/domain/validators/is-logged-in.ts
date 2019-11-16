import * as S from "sanctuary";

import {ChainableFunction} from "../../helpers/chain";
import {toMaybe} from "../../helpers/sanctuary/toMaybe";
import {Result} from "../actions/action";
import {toEither} from "../../helpers/sanctuary/toEither";

const convertToErrorType: (x: DomainErrorsTypes ) => (y: string) => Failure =
    type => reason => ({
        reason,
        type,
    });

const toError: (x: DomainErrorsTypes) => (y: string) => Failure =
    errorCode => reason => convertToErrorType(errorCode)(reason);

const failureToSuccess: (x: Failure) => Result<string> =
    _ => S.Right({value: "success", reason: "200"});

function successToFailureWithParams<T>(failure: Failure): (y: Success<T>) => Result<T> {
    return () => S.Left(failure);
}

export function invertWithParams<T>(failure: Failure):
    (func: ChainableFunction<T>) => ChainableFunction<T> {
    return func => x => {
        const bifunctor = S.bimap(failureToSuccess)(successToFailureWithParams(failure))(func(x)) as Result<T>;
        // TODO AkS: As seen below, some really stranges usage of Eihter.
        return S.either(S.I)(S.I)(bifunctor) as Either<Failure, Success<string>>;
    };
}

export const isAuthenticated: ChainableFunction<LoginAccount.User> =
    userOrUndefined => toEither(toError("unauthorized")("forbidden"))(userOrUndefined);

export const isAuthorized: (page: string) => ChainableFunction<LoginAccount.User> =
    page => user => {
        const pageUuid = toMaybe(page);

        const userUuid = S.map(S.prop("userId"))(toMaybe(user));
        const isAuthorizedMaybe: Maybe<LoginAccount.User> = S.equals(userUuid)(pageUuid) ? toMaybe(user) : S.Nothing;

        return S.maybeToEither(toError("forbidden")("unauthorized"))(isAuthorizedMaybe);
    };
