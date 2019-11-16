import {FutureInstance} from "fluture";
import {Rush, RushDescription} from "../settings/types";

export as namespace Settings

type Result<T> = FutureInstance<Failure, Success<T>>;
type RepositoryResult<T> = FutureInstance<RepositoryError, T>;

type Type = typeof Rush;

type Value = typeof RushDescription;

export interface Limit {
    whenLimitIsNotReached: () => FutureInstance<string, {status: "ok"}>;
}

export interface PersistentStorage {
    getSetting: (x: Type) => RepositoryResult<Value>;
}
