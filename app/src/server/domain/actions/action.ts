import {FutureInstance} from "fluture";
import {StreamId} from "./streamId";

export type ActionToWebResponse<U> = () => Result<U>;
export type UuidProvider = () => FutureStreamId;
export type FutureI<T> = FutureInstance<string, T>;
// ADAPTERS to DOMAIN
export type FutureStreamId = FutureI<StreamId>;

// DOMAIN to PORTS
export type FutureResult<T> = FutureInstance<Failure, Success<T>>;
export type FutureResultA<T> = FutureInstance<Failure[], Success<T>>;

export type Result<U> = Either<Failure, Success<U>>;
