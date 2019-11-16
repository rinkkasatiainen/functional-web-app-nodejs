import {DomainFailure} from "./errors";

declare global {
    type Failure = DomainFailure<DomainErrorsTypes>;

    interface Success<A> {
        value: A;
        reason?: string;
    }
}
