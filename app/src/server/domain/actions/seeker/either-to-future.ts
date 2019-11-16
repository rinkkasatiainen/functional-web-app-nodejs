import {Future, FutureInstance} from "fluture";

import {create, env} from "sanctuary";
// tslint:disable-next-line:no-var-requires
const {env: flutureEnv} = require("fluture-sanctuary-types");
const S = create({checkTypes: true, env: env.concat(flutureEnv)});

type EitherToFuture<A, B> = (z: Either<A, B>) => FutureInstance<A, B>;

// tslint:disable-next-line:no-any
export const eitherToFuture: EitherToFuture<any, any> =
    either => {
        return S.either(Future.reject)(Future.of)(either);
    };
