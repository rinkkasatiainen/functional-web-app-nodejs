import {Request, Response} from "express";

import {devDebugLog} from "../../../helpers/development-debug";
import {debugLog} from "../helpers/debug-log";

export type RequestResponseParams = ({ req: Request, res: Response });

export function debugLogForDev<T>(params: { req: Request, res: Response }): (x: T) => void {
    return entry => devDebugLog<T>("", {entry});
}

export function logout<T>(params: { req: Request, res: Response }): (x: T) => void {
    return () => params.req.logout();
}

export function logentry<T>(params: { req: Request, res: Response }): (x: T) => void {
    return entry => debugLog<T>("logging entry", {entry});
}

export const reportErrors: ReqRes<HandleError> =
    ({req}) => {
        return (error: Failure): void => {
            const reason = error.type || "503";
            req.flash("" + reason, error.reason);
        };
    };

export const reportCommandSuccess: ReqRes<HandleOk<CommandStatus>> =
    ({req}) => {
        return (x: Success<CommandStatus>): void => {
            const status = x.value.status;
            req.flash(`${status}`, `${x.value.text}`);
        };
    };

export function reportSuccess<T>(successString: string): ReqRes<HandleOk<T>> {
    return ({req}: { req: Request, res: Response }) => {
        return (success: Success<T>): void => {
            const reason = success.reason || "200";
            req.flash(reason, successString);
        };
    };
}

export function redirectTo<T>(url: string): ReqRes<HandleError> {
    return ({res}) => (error: Failure) => {
        // tslint:disable-next-line
        console.log("REDIRECT TO", {url, error});
        res.redirect(url);
    };
}

export interface RenderResponse<T> {
    path: string;
    value: T;
}

export function returnJsonOnSuccess<T, P>(fun: (x: T) => P): ReqRes<HandleOk<T>> {
    return ({res}) => (result: Success<T>) => {
        devDebugLog("returning JSON", {entry: result.value});
        const jsonResponse = fun(result.value);
        res.json(jsonResponse);
    };
}

export function renderOnSuccess<T, P extends {}>(fun: (x: T) => RenderResponse<P>): ReqRes<HandleOk<T>> {
    return ({res}) => (result: Success<T>) => {
        devDebugLog("Rendering user", {entry: result.value});
        const renderResponse = fun(result.value);
        const options: object = renderResponse.value;
        res.render(renderResponse.path, options);
    };
}

export function redirectOnSuccess<T>(fun: (x: T) => string):
    ReqRes<HandleOk<T>> {
    return ({res}) => (result: Success<T>) => {
        devDebugLog("redirect on success", {entry: result});
        res.redirect(fun(result.value));
    };
}
