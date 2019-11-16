import {devDebugLog} from "../../../helpers/development-debug";
import {ErrorResult, SuccessResult} from "./handle-future";

export const redirectTo: (url: string) => (y: Failure) => ErrorResult =
    url => () => ({redirectTo: url});


export function redirectOnSuccess<T>(fun: (x: T) => string): (y: Success<T>) => SuccessResult<T> {
    return (result: Success<T>) => {
        devDebugLog("redirect on success", {entry: result});
        return {redirectTo: fun(result.value)};
    };
}
