import {Request, Response} from "express";
import S = require("sanctuary");

import {FutureResult} from "../../../domain/actions/action";
import flip from "../../../helpers/sanctuary/flip";
import {toMaybe} from "../../../helpers/sanctuary/toMaybe";

export type ErrorStatus = "loginError" | "internal";

export interface WithToken {
    token?: string;
}

export interface ErrorResult extends WithToken {
    status?: ErrorStatus;
    error?: Failure;
    redirectTo?: string;
}

type SuccessStatus = "ok" | "created";

export interface SuccessResult<T> extends WithToken {
    status?: SuccessStatus;
    value?: T;
    redirectTo?: string;
}

type HandleError = (x: Failure) => ErrorResult;
type HandleOk<T> = (x: Success<T>) => SuccessResult<T>;

type ResponseType<T> = Success<T> | Failure ; // SuccessResponse<T> | ErrorResponse;
type HandleResponse<T> = HandleError | HandleOk<T>;

const buildResponseFromFunctions = <A, B, C extends {}>(funcs: A[]): (response: B) => C => success => {
    const arrayOfResults = flip<A, B, C>(funcs)(success);
    // this looks like a flatmap!
    return arrayOfResults.reduce((result, item) => ({...result, ...item}), {}) as C;
};

export function handle<T>(funcs: Array<HandleResponse<T>>):
    (params: { req: Request, res: Response }) => (response: ResponseType<T>) => void {
    return ({req, res}) => response => {

        const errorResult = buildResponseFromFunctions(funcs)(response);

        const methods = [sendErrorDetails, sendCommandStatus, sendJson];
        flip(flip(methods)(errorResult))({req, res});
    };
}
export function executeInFuture<R>(params: {req: Request, res: Response}):
    (onLeft: (x: {req: Request, res: Response}) => ((y: Failure) => void) ) =>
        (onRight: (y: {req: Request, res: Response}) => ((y: Success<R>) => void) ) =>
            (z: FutureResult<R>) =>
                void  {
    return onLeft => onRight => future => {
        future.fork(onLeft(params), onRight(params));
    };
}
export function executeEither<R>(params: {req: Request, res: Response}):
    (onLeft: (x: {req: Request, res: Response}) => (x: Failure) => void ) =>
        (onRight: (y: {req: Request, res: Response}) => (x: Success<R>) => void ) =>
            (z: Either<Failure, R>) =>
                void  {
    return onLeft => onRight => eitherResult => {
        S.either(onLeft(params))(onRight(params))(eitherResult);
    };
}

export function handleErrors<T>(funcs: HandleError[]): (z: Failure) => ErrorResult {
    return failure => buildResponseFromFunctions<HandleError, Failure, ErrorResult>(funcs)(failure);
}

export function handleSuccess<T>(funcs: Array<HandleOk<T>>): (y: Success<T>) => SuccessResult<T> {
    return success => buildResponseFromFunctions<HandleOk<T>, Success<T>, SuccessResult<T>>(funcs)(success);
}

export const sendJson: (x: ErrorResult) => (reqRes: { req: Request, res: Response }) => void =
    errorResult => ({req, res}) => {
        res.json(errorResult);
    };

const mapDomainErrorTypesToHttpStatusCodes = {
    "created": 201,
    "forbidden": 403,
    "internal": 500,
    "internal-error": 500,
    "ok": 200,
    "rush": 423,
    "thread-closed": 410,
    "unauthorized": 401,
};
const INTERNAL_SERVER_ERROR = 500;

const toStatusCode: (x: DomainErrorsTypes | CommandStatusTypes ) => number =
    domainErrorType => {
        return S.fromMaybe(INTERNAL_SERVER_ERROR)(toMaybe(mapDomainErrorTypesToHttpStatusCodes[domainErrorType]));
    };

const setStatusCode: (x: { type: DomainErrorsTypes }) => (y: Response) => void =
    code => response => response.status(toStatusCode(code.type));

const setCommandStatusCode: (x: CommandStatus) => (y: Response) => void =
    code => response => response.status(toStatusCode(code.status));

export const sendErrorDetails: (x: ErrorResult) => (reqRes: { req: Request, res: Response }) => void =
    errorResult => ({req, res}) => {
        const hoist = S.Just;
        const toElevatedWorld: (x?: Failure) => Maybe<Failure> = toMaybe;
        const inElevatedWorld = toElevatedWorld(errorResult.error);
        S.ap(S.ap(hoist(setStatusCode))(inElevatedWorld))(hoist(res));
    };

export const sendCommandStatus: (x: SuccessResult<CommandStatus>) => (reqRes: { req: Request, res: Response }) => void =
    ({command}) => ({req, res}) => {
        const hoist = S.Just;
        const toElevatedWorld: (x?: CommandStatusTypes ) => Maybe<CommandStatusTypes> = toMaybe;
        const inElevatedWorld = toElevatedWorld(command);
        S.ap(S.ap(hoist(setCommandStatusCode))(inElevatedWorld))(hoist(res));
    };
