import {Request, Response} from "express";
import {RequestResponseParams} from "../routes/mapper/session_based_mappings";

declare global {
    type HandleError = (x: Failure) => void;
    type HandleOk<T> = (x: Success<T>) => void;
// tslint:disable-next-line
    type HandleResponse = HandleError | HandleOk<any>;

    type ReqRes<T> = (p: RequestResponseParams) => T;
    type HandleErrors = (funcs: Array<ReqRes<HandleResponse>>) =>
        (params: { req: Request, res: Response }) =>
            (z: Failure) => void;

    type HandleSuccess<T> = (funcs: Array<ReqRes<HandleResponse>>) =>
        (params: { req: Request, res: Response }) =>
            (z: Success<T>) => void;
}
