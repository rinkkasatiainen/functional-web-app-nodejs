import {ErrorResult, SuccessResult} from "./handle-future";

export const reportErrors: (x: Failure) => ErrorResult =
    failure => ({error: failure});

export const reportSuccess = <T>(reason: string) => (success: Success<T>): SuccessResult<T> => {
    // TODO AkS: Reason si not used!
    return {...success};
}

export const reportCommandSuccess: (y: Success<CommandStatus>) => SuccessResult<CommandStatus> =
    result => ({ command: result.value, value: result.value })
