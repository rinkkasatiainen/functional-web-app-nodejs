import {Request, Response} from "express";
import * as S from "sanctuary";

import flip from "../../../helpers/sanctuary/flip";
import {ValidationErrors} from "../../types/validation";
import {RequestResponseParams} from "./session_based_mappings";

// :: {req, res} => [ ({req, res} => HandleErrorResult ] -> ValidationErrors -> void
export const onErrorDo = handleSingleResponse2222;
export const handleErrors: HandleErrors =
    funcs => params => x => onErrorDo(funcs)(params)(x);

export function handleSuccess<T>(funcs: Array<ReqRes<HandleOk<T>>>):
    (params: { req: Request, res: Response }) => (z: Success<T>) => void {
       return params => x => onSuccessFuture(funcs)(params)(x);
}

// :: [ ({req, res} => HandleResponse ] => {req, res} -> Success<T> -> void
export function onSuccessDo<T>(funcs: Array<ReqRes<HandleOk<T>>>):
    (params: { req: Request, res: Response }) => (z: RightLike<Success<T>>) => void {
    return params => succesResponse => handleSingleResponse2222<HandleOk<T>, T>(funcs)(params)(succesResponse.value);
}

export function onSuccessFuture<T>(funcs: Array<ReqRes<HandleOk<T>>>):
    (params: { req: Request, res: Response }) => (z: Failure | Success<T>) => void {
    return params => succesResponse => handleSingleResponse2222<HandleOk<T>, T>(funcs)(params)(succesResponse);
}

export function onValidationErrorsDoX<T, U>({req, res}: RequestResponseParams):
    (funcs: Array<ReqRes<HandleResponse>>) => (p: RequestResponseParams) => (v: ValidationErrors) => void {
    return funcs => params => listOfErrors => {
        const requestAndResponseAppliedToFunctions =
            flip<ReqRes<HandleResponse>, RequestResponseParams, HandleResponse[]>(funcs)({req, res});
        S.ap(requestAndResponseAppliedToFunctions)(listOfErrors);
    };
}

export const onValidationErrorsDo:
    (y: Array<ReqRes<HandleError>>) => (x: { req: Request, res: Response }) => (z: ValidationErrors) => void =
    funcs => ({req, res}) => listOfErrors => {
        const requestAndResponseAppliedToFunctions =
            flip<ReqRes<HandleResponse>, RequestResponseParams, HandleResponse[]>(funcs)({req, res});

        S.ap(requestAndResponseAppliedToFunctions)(listOfErrors);
    };

type ResponseType<T> = RightLike<T> | Failure | Success<T>;

function handleSingleResponse2222<T, U>(funcs: Array<ReqRes<HandleResponse>>):
    (params: { req: Request, res: Response }) => (z: ResponseType<U>) => void {
    return params => response => {
        const applyParamsToFuncs =
            flip<ReqRes<HandleResponse>, RequestResponseParams, HandleResponse>(funcs)(params);

        flip<HandleResponse, ResponseType<U>, void>(applyParamsToFuncs)(response);
    };
}
