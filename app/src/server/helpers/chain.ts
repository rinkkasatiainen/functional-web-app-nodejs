import Future, {FutureInstance} from "fluture";
import S = require("sanctuary");
import {FutureResult, Result} from "../domain/actions/action";
import {eitherToFuture} from "../domain/actions/seeker/either-to-future";
import {toMaybe} from "./sanctuary/toMaybe";

// tslint:disable:no-var-requires
const pipeK = require("./sanctuary/pipeK");
const pipeFunc = require("./sanctuary/pipe");
// tslint:enable:no-var-requires

// export type Monad<A, B> = (x: Maybe<A> | Either<any, A>) => Maybe<B> | Result<B>;
export type MaybeToEither<A, B> = (x: Maybe<A>) => Result<B>;
export type MaybeToMaybe<A, B> = (x: Maybe<A>) => Maybe<B>;
export type EitherToEither<A, B> = (x: Result<A>) => Result<B>;
export type EitherToMaybe<A, B> = (x: Result<A>) => Maybe<B>;
export type Monad<A> = Maybe<A> | Result<A>;

export type PossbileNullToEither<A> = (x?: A) => Result<A>;
export type MonadicFunc<A, B> = MaybeToMaybe<A, B> | MaybeToEither<A, B> | EitherToEither<A, B> | EitherToMaybe<A, B> ;

export type ChainableFunction<T> = PossbileNullToEither<T>;
export type ChainableBiFunction<A, B> = PossbileNullToEither<A> | MonadicFunc<A, B>;

type InputFunc<T> = ((x?: T) => Either<string, T>);

export function pipe<A, B, C>(a: Array<MonadicFunc<A, B>>): (y: Monad<A>) => Monad<B> {
    return b => pipeFunc(a)(b);
}

const error = "Function called with wrong parameters, inputFuncs must not be empty";

type LiftedFuncs<T> = ((x ?: T) => T);

// @ts-ignore - this does not work
function chainLifted<T>(functionsToChain: Array<LiftedFuncs<T>>): (y: Maybe<T>) => Result<T> {
    return maybeEntity => {
        const firstIsMaybeToEither = S.head(functionsToChain);
        // console.log({firstIsMaybeToEither, firstFunction})
        const firstFunction: InputFunc<T> = S.fromMaybe(() => S.Left(error))(firstIsMaybeToEither);
        const input = S.maybeToNullable(maybeEntity) as T | undefined;
        // console.log({ input})
        firstFunction(input);
        const funcs = S.fromMaybe([])(S.Just(functionsToChain));
        // console.log({funcs})
        // console.log("S.chain", S.chain(funcs)(S.toMaybe(maybeEntity)))
        // console.log("S.pipeK", S.pipeK(funcs)(S.toMaybe(maybeEntity)))
        return pipeK(funcs)(toMaybe(maybeEntity));
    };
}

export function chainMonadicFunctions<A, B>(functionsToChain: Array<MonadicFunc<A, B>>): (m: Monad<A>) => Monad<B> {
    // @ts-ignore
    const inputFromMaybe = maybeValue => S.maybeToNullable(maybeValue);
    // @ts-ignore
    const inputFromEither = eitherValue => S.rights([eitherValue])[0];

    const recursiveFun: (x: Array<MonadicFunc<A, B>>) => (y: Monad<A>) => Monad<B> =
        functions => innerMonad => {
            // tslint:disable:no-console
            console.log("stepping into recrusive function", innerMonad, functions);
            if (functions.length === 0) {
                console.log(" ! returning recursioive", innerMonad);
                return innerMonad;
            }
            let firstFunction: MonadicFunc<A, B> | null = null;
            // @ts-ignore
            const firstIsMaybeToEither = S.head(functions);
            firstFunction =
                S.fromMaybe(() => S.Left(error))(firstIsMaybeToEither);

            const {name} = S.type(innerMonad);
            // @ts-ignore
            const input = (name === "Maybe") ?
                // @ts-ignore
                inputFromMaybe(innerMonad) : (name === "Either") ? inputFromEither(innerMonad) : S.Nothing;
            // const input = S.Nothing;
            console.log("  input", input, firstFunction);
            // @ts-ignore
            const eitherValueOfFirstFunction = firstFunction(innerMonad);
            console.log(" either value of first function", eitherValueOfFirstFunction);

            const rest = S.tail(functions);
            console.log(" rest: ", rest);
            // @ts-ignore
            const restFuncs = S.fromMaybe_(() => [])(rest);
            // @ts-ignore
            return recursiveFun(restFuncs)(eitherValueOfFirstFunction);

            // tslint:enable:no-console
        };

    return monad => {
        return recursiveFun(functionsToChain)(monad);
    };
}
// @ts-ignore
const chainFuturesA = f => (original) => f.reduce(
// @ts-ignore
    (previousValue, func) => previousValue.chain(func),
    Future.of(original),
);

// tslint:disable-next-line:no-any
type magicFunc = (a: any) => FutureInstance<any, any>;

export function validateM<T, U>(funcs: Array<ChainableFunction<T>>): (u: Maybe<T>) => {
    andThen: (x: magicFunc[]) => (y: StreamId) => FutureInstance<Failure, U>,
    result: FutureResult<T>;
} {
    return input => ({
        andThen: thenFuncs => {
            return (x: StreamId) => validate(funcs)(input).and(chainFuturesA(thenFuncs)(x));
        },
        result: validate<T>(funcs)(input).map(value => ({value})),
    });
}

export function validate<T>(funcs: Array<ChainableFunction<T>>): (u: Maybe<T>) => FutureInstance<Failure, T> {
    return userAccountDetails =>  eitherToFuture(chainAllMaybeToResultFuncs<T>(funcs)(userAccountDetails));
}

export function chainAllMaybeToResultFuncs<T>(functionsToChain: Array<ChainableFunction<T>>):
    (y: Maybe<T>) => Result<T> {
    return maybeUserAccount => {
        const input = S.maybeToNullable(maybeUserAccount) as T | undefined;

        const firstIsMaybeToEither = S.head(functionsToChain);
        const firstFunction: InputFunc<T> =
            S.fromMaybe(() => S.Left(error))(firstIsMaybeToEither);
        const eitherValueOfFirstFunction = firstFunction(input);

        const rest = S.tail(functionsToChain);
        const restFuns: Array<(x: T) => Result<T>> = S.fromMaybe([])(rest);

        const res = pipeK(restFuns)(eitherValueOfFirstFunction);
        return res;
    };
}
