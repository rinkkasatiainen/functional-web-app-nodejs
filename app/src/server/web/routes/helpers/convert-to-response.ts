import {Request, Response} from "express";
import * as S from "sanctuary";
import {FutureResult, FutureResultA, Result} from "../../../domain/actions/action";
import {StreamId} from "../../../domain/actions/streamId";
import {devDebugLog} from "../../../helpers/development-debug";
import {ValidationErrors} from "../../types/validation";

export const toGenericError = (reason: string) => [ {type: "internal", reason} ] as ValidationErrors;

export function toGenericResponse<T>(x: T): Success<T> {
    return { value: x };
}

export function convertToResponse<U, T>(either: Either<Failure[], U>): Result<T> {
    return S.map(toGenericResponse)(either) as Result<StreamId>;
    // return S.bimap(S.I)(toGenericResponse)(either) as Result<number, StreamId>;
}

export const requestToResponse:
    (x: (x: ValidationErrors) => void)
        => (y: (x: Success<LoginAccount.User>) => void)
        => (z: Result<StreamId>)
        => void =
    left => right => eitherErrorOrSuccess =>
        S.either(left)(right)(eitherErrorOrSuccess);

export const convertToResponseEntity: (x: StreamId) => Success<StreamId> =
    streamId => ({ value: streamId } as Success<StreamId>);

// (left) => (right) => Either<ValidationErrors, U> => void
export function handleResponse<T>(onLeft: (x: ValidationErrors) => void):
    (y: (x: {value: Success<T>}) => void ) => (z: Either<Failure[], T>) => void  {
    return onRight => eitherResult => {
        S.either(onLeft)(onRight)(convertToResponse(eitherResult));
    };
}

function convertMagic<T>(either: Either<Failure, T>): Either<Failure[], Success<T>> {
    return S.map(toGenericResponse)(either) as Either<Failure, Success<T>>;
    // return S.bimap(S.of(Array))(toGenericResponse)(either) as Either<Failure[], Success<T>>;
    // return S.bimap(S.of(Array))(S.map(x => ({value: x})))(either) as Either<Failure[], T>;
}

// (left) => (right) => Either<ValidationErrors, U> => void
export function handleResponse2<R>(params: {req: Request, res: Response}):
    (onLeft: (x: {req: Request, res: Response}) => OnLeft<Failure> ) =>
        (onRight: (y: {req: Request, res: Response}) => OnRight<Success<R>> ) =>
            (z: Either<Failure, R>) =>
                void  {
    return onLeft => onRight => eitherResult => {
        S.either(onLeft(params))(onRight(params))(convertMagic<R>(eitherResult));
    };
}

export function handleFutureType<B>(params: {req: Request, res: Response}):
    (onLeft: (x: {req: Request, res: Response}) => ((y: Failure[]) => void) ) =>
        (onRight: (y: {req: Request, res: Response}) => ((y: Success<B>) => void) ) =>
            (z: FutureResultA<B>) =>
                void  {
    devDebugLog("HandleFuture", {entry: params});
    return onLeft => onRight => future => {
        future.fork(onLeft(params), onRight(params));
    };
}
// (left) => (right) => Either<ValidationErrors, U> => void
export function handleFuture<R>(params: {req: Request, res: Response}):
    (onLeft: (x: {req: Request, res: Response}) => ((y: Failure) => void) ) =>
        (onRight: (y: {req: Request, res: Response}) => ((y: Success<R>) => void) ) =>
            (z: FutureResult<R>) =>
                void  {
    return onLeft => onRight => future => {
        future.fork(onLeft(params), onRight(params));
    };
}
