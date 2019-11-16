import {ChainableFunction, chainAllMaybeToResultFuncs} from "../../../helpers/chain";
import {
    invertWithParams,
    isAuthenticated,
} from "../../validators/is-logged-in";

import {FutureResult, UuidProvider} from "../action";

import {FutureInstance} from "fluture";
import {toMaybe} from "../../../helpers/sanctuary/toMaybe";
import {convertToResponseEntity} from "../convert-to-response-entity";
import {StreamId} from "../streamId";
import {eitherToFuture} from "./either-to-future";

const not: (x: ChainableFunction<LoginAccount.User> ) => ChainableFunction<LoginAccount.User> =
    func => invertWithParams<LoginAccount.User>({type: "forbidden", reason: "unauthorized"})(func);

export type CreateNewMessageThreadType =
    (x: Settings.Limit) => (y: UuidProvider) => (z?: LoginAccount.User) => FutureResult<StreamId>;

// TODO AkS: Get rid of duplication!!!!
const convertError: (x: {type: DomainErrorsTypes }) => (y: string | Failure ) => Failure =
    hashToAdd => y => {
        if (typeof y === "string") {
            return {
                ...hashToAdd,
                reason: y,
            };
        } else {
            return y;
        }
    } ;

export const isRoomForNewMessageThread: (x: Settings.Limit) => () => FutureInstance<string, {status: "ok"}> =
    limit => () => limit.whenLimitIsNotReached();

export const CreateNewMessageThread: CreateNewMessageThreadType =
    limit => uuidProvider => userAccountDetails => {
    const x = chainAllMaybeToResultFuncs<LoginAccount.User>([
            not(isAuthenticated),
        ])(toMaybe(userAccountDetails));

    const asFuture = eitherToFuture(x);

    return asFuture
            .chain(
                isRoomForNewMessageThread(limit),
            )
            .chain(
                uuidProvider,
            )
            .bimap(
                convertError({type: "rush"}),
                convertToResponseEntity,
            ) as FutureResult<StreamId>;
    };
