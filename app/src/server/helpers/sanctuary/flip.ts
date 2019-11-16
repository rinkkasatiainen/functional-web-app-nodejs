"use strict";
import * as S from "sanctuary";

// tslint:disable-next-line:no-default-export
export default function flip<A, B, C>( funcs: A[]): (params: B) => C[] {
    // tslint:disable-next-line:no-any
    return params => S.flip(funcs as any)(params as any) as any;
}
