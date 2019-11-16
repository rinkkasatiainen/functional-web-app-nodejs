import {expect, use as chaiUse} from "chai";
import * as S from "sanctuary";
import * as sinonChai from "sinon-chai";

chaiUse(sinonChai);

import {
    ChainableFunction,
    chainAllMaybeToResultFuncs,
    MaybeToEither,
    pipe,
} from "./chain";
import {toEither} from "./sanctuary/toEither";

const reverseString: (x: string) => string = S.pipe([S.splitOn(""), S.reverse, S.joinWith("")]);

type MaybeToEitherType = MaybeToEither<string, string>;
type MaybeToMaybeType = (x: Maybe<string>) => Maybe<string>;
type EitherToEitherType = (x: Either<string, number>) => Either<string, number>;
type EitherToMaybeType = (x: Either<string, number>) => Maybe<string>;

type chainableFunction = (x?: string) => Either<number, string>;

const reverse: ChainableFunction<string> = x => S.map(reverseString)(toEither(1)(x)) as Either<number, string>;
const shouldNeverBeCalled: chainableFunction = x => {
    throw new Error("Should be short circuited earlier");
};

const duplicate: chainableFunction = x => S.map(y => `${y} ${y}`)(toEither(2)(x)) as Either<number, string>;
const returnsLeft: chainableFunction = x => S.Left("foobar");
const spyParameterAndReturnItAsLeft: ChainableFunction<string> = x => S.Left(x);

const maybeToEither: MaybeToEitherType = x =>
    S.map(reverseString)(S.maybeToEither("ERROR on MaybeToEither")(x)) as Either<string, string>;
const maybeToMaybe: MaybeToMaybeType = x => S.map(S.toLower)(x) as Maybe<string>;
const eitherToEither: EitherToEitherType = x => S.map(S.toUpper)(S.map(reverseString)(x)) as Either<number, string>;
const eitherToMaybe: EitherToMaybeType = x => S.map(y => `${y}, ${y}`)(S.eitherToMaybe(x)) as Maybe<string>;

describe("a pipe func", () => {
    describe("one function", () => {
        it("functions should work", () => {
            expect(maybeToMaybe(S.Just("m2m"))).to.eql(S.Just("m2m"));
            expect(eitherToMaybe(S.Right("e2m"))).to.eql(S.Just("e2m, e2m"));
            expect(eitherToEither(S.Right("e2e reversed"))).to.eql(S.Right("DESREVER E2E"));
            expect(maybeToEither(S.Just("m2e"))).to.eql(S.Right("e2m"));
        });

        it("should do magic on Notghin / LEFT", () => {
            expect(pipe<string, string, string>([maybeToMaybe])(S.Nothing)).to.eql(S.Nothing);
            expect(pipe([maybeToEither])(S.Nothing)).to.eql(S.Left("ERROR on MaybeToEither"));
            expect(pipe([eitherToMaybe])(S.Left("Error on E2M"))).to.eql(S.Nothing);
            expect(pipe([eitherToEither])(S.Left("anything"))).to.eql(S.Left("anything"));
        });
    });

    describe("sequence of funcs", () => {
        it("should work", () => {
            const result = pipe([maybeToEither, eitherToMaybe])(S.Just("M2E to E2M"));
            // const result = pipe([maybeToMaybe, eitherToMaybe])(S.Just("M2E to E2M"));
            expect(result).to.eql(S.Just("M2E ot E2M, M2E ot E2M"));
        });
        it("should work on all four", () => {
            let result = pipe([maybeToEither, eitherToEither, eitherToMaybe, maybeToMaybe])(S.Just("All Together"));
            // const result = pipe([maybeToMaybe, eitherToMaybe])(S.Just("M2E to E2M"));
            expect(result).to.eql(S.Just("all together, all together"));

            result = pipe([eitherToEither, eitherToMaybe])(S.Right("e2E to e2M"));
            expect(result).to.eql(S.Just("M2E OT E2E, M2E OT E2E"));

            result = pipe([maybeToEither, eitherToEither, eitherToMaybe])(S.Just("m2E to e2E"));
            expect(result).to.eql(S.Just("M2E TO E2E, M2E TO E2E"));
        });
    });

});

// describe(chainLifted.name, () => {
//     describe("with 0 functions", () => {
//         it("should do nothing", () => {
//             const result = chainLifted([])(S.Just("string"));
//             expect(result).to.eql (S.Just("string"));
//         });
//     });
//
//     type liftedFunction = (x?: string) => string;
//
//     describe("with 1 function", () => {
//         const returnsX: liftedFunction = x => `-${x}-`;
//         const throwsIfNotExists: liftedFunction = x => { if (!x) {throw new Error("Failure"); } return x; };
//         it("should convert a Just to Rigth", () => {
//             const result = chainLifted<string>([returnsX])("string");
//             expect(result).to.eql (S.Right("-string-"));
//         });
//         it("should convert a Nothing to Left", () => {
//             const result = chainLifted<string>([throwsIfNotExists])(S.Nothing);
//             expect(result).to.eql (S.Left(1));
//         });
//     });
// });

describe(chainAllMaybeToResultFuncs.name, () => {
    describe("with 0 functions", () => {
        it("should do nothing", () => {
            // const argumentArray = [];
            chainAllMaybeToResultFuncs([]);
        });
    });

    describe("with 1 function", () => {
        const aMaybeToEither: chainableFunction = x => toEither(1)(x);
        it("should convert a Just to Rigth", () => {
            const result = chainAllMaybeToResultFuncs([aMaybeToEither])(S.Just("string"));
            expect(result).to.eql(S.Right("string"));
        });
        it("should convert a Nothing to Left", () => {
            const result = chainAllMaybeToResultFuncs([aMaybeToEither])(S.Nothing);
            expect(result).to.eql(S.Left(1));
        });
    });
    describe("with more than 1 function", () => {

        it("When both are JUST, should return the last", () => {
            const result = chainAllMaybeToResultFuncs([reverse, duplicate])(S.Just("string"));
            expect(result).to.eql(S.Right("gnirts gnirts"));
        });

        it("should short circuit whenever a LEFT is returned by a Function", () => {
            const result = chainAllMaybeToResultFuncs([reverse, shouldNeverBeCalled])(S.Nothing);
            expect(result).to.eql(S.Left(1));
        });

        it("should short circuit whenever a LEFT is returned by a Function, 2", () => {
            const result = chainAllMaybeToResultFuncs([reverse, returnsLeft, shouldNeverBeCalled])(S.Just("string"));
            expect(result).to.eql(S.Left("foobar"));
        });

        it("should pass the function result to next function", () => {
            const result = chainAllMaybeToResultFuncs([
                reverse, spyParameterAndReturnItAsLeft, shouldNeverBeCalled,
            ])(S.Just("string"));
            expect(result).to.eql(S.Left("gnirts"));
        });
    });

    // describe("chain Monadic Functions / WIP", () => {
    //     const m2E: MaybeToEither<string, string> =
    //         x => S.map(reverseString)(S.toEither(1)(x)) as Either<number, string>;
    //     const m2M: MaybeToMaybe<string, string> = x => S.map(S.toLower)(S.Just(x)) as Maybe<string>;
    //     const e2E: EitherToEither<string, string> =
    //         x => S.map( (xy: string) => `${xy}-${xy}`)(S.map(reverseString)(S.Right(x))) as Either<number, string>;
    //     const e2M: EitherToMaybe<string, string> = x => S.eitherToMaybe(x) as Maybe<string>;
    //
    //     it("should support Maybe to Either", () => {
    //         const result = chainMonadicFunctions([m2E])(S.Just("Maybe to Either"));
    //         expect(result).to.eql(S.Right("rehtiE ot ebyaM"));
    //     });
    //     it("given one MaybeToMaybe, returns a Maybe", () => {
    //         const result = chainMonadicFunctions([m2M])(S.Just("Maybe to Maybe"));
    //         expect(result).to.eql(S.Just("maybe to maybe"));
    //     });
    //     it("given one Either to Either, returns value", () => {
    //         const result = chainMonadicFunctions([e2E])(S.Right("Either to Either"));
    //         expect(result).to.eql(S.Right("REHTIE OT REHTIE"));
    //     });
    //
    //     describe("on different types on chain", () => {
    //
    //         it("should be able to chain monadic methods", () => {
    //             const result = chainMonadicFunctions([m2E, e2E, e2M])(S.Just("soMething"));
    //             expect(result).to.eql(S.Just("gnihtemos"));
    //         });
    //
    //         it("should be able to chain monadic methods", () => {
    //             let res: Monad<string> = S.Nothing
    //             res = chainMonadicFunctions([m2M, m2E])(S.Just("M2M to M2E"));
    //             expect(res).to.eql(S.Right("e2e ot m2m"));
    //             res = chainMonadicFunctions([m2E, m2M])(S.Just("M2E to M2M"));
    //             res = chainMonadicFunctions([m2E, e2M])(S.Just("M2E to E2M"));
    //             res = chainMonadicFunctions([e2M, m2E])(S.Just("E2M to M2E"));
    //         });
    //         const assertTypeErrorThrown = (func: any) => {
    //             try {
    //                 func();
    //             } catch (e) {
    //                 if (e.name = "TypeError") {
    //                     return;
    //                 }
    //             }
    //             throw new Error("A type error should have been thrown");
    //         };
    //
    //         it("A function returning Either, can take input param as Maybe or Either", () => {
    //             assertTypeErrorThrown(() => chainMonadicFunctions([m2E, m2M, m2E])(S.Just("M2M to M2E")));
    //         });
    //     });
    // });
});
