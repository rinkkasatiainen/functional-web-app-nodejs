import {convertToErrorType} from "../../../domain/actions/convert-to-error";

export const toError: (x: DomainErrorsTypes) => (y: string) => Failure =
    errorCode => reason => convertToErrorType({type: errorCode})(reason);
