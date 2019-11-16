import * as S from "sanctuary";

export function toMaybe<T>(x?: T): Maybe<T> {
    if (x) {
        return S.Just(x);
    }
    return S.Nothing;
}

