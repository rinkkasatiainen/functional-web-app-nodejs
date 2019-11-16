import {devDebugLog} from "../../../helpers/development-debug";
import {debugLog} from "../helpers/debug-log";
import {ErrorResult, SuccessResult} from "./handle-future";

export function logEntry<T>(entry: T): {} {
    debugLog<T>("logging entry", {entry});
    return {};
}

export const debugLogForDev = <T>(entry: Success<T> | Failure): SuccessResult<T> | ErrorResult => {
    devDebugLog<Success<T> | Failure>("", {entry});
    return {};
}
