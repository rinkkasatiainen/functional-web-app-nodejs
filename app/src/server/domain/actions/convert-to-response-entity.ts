import {StreamId} from "./streamId";

export function convertToResponse<T>(value: T): Success<T> {
    return {value};
}
export const convertToResponseEntity: (x: StreamId) => Success<StreamId> =
    streamId => ({ value: streamId } as Success<StreamId>);
