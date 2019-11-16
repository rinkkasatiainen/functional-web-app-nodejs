import {FutureInstance} from "fluture";

declare global {
    interface GlobalProjection {
        type: string;
    }
    type Projection = GlobalProjection;

    type DomainQuery<A extends DomainError, B extends Projection> =
        FutureInstance<A, B>;
    type MessageFromRepository<A extends Projection> =
        (streamId: StreamId) => DomainQuery<DomainError, MessageThreadProjection>;
}
