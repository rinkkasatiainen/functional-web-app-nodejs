import * as S from "sanctuary";

export function toEither<L, R>(left: L): (r ?: R | null) => Either<L, R> {
    return right => {
        if (right) {
            return S.Right(right);
        }
        return S.Left(left);
    };
}
