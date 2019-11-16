import Future, {FutureInstance} from "fluture";
import {isLaterThan} from "../../../entities/time";
import {DomainFailure} from "../../../types/errors";

export const findMessage:
    (y: Message.QueryRepository) =>
        (streamId: StreamId) =>
            // tslint:disable-next-line:no-any
            FutureInstance<DomainFailure<any>, MessageEntity> =
    repository => streamId => {
        return repository.findMessage(streamId)
            .mapRej((error: RepositoryError) => ({...error, type: "internal"}))
            .chain(
                entity => ensureCanOpen(entity),
            );
    };

const ensureCanOpen: (x: Message.Entity) => FutureInstance<DomainFailure<"thread-closed">, Message.Entity> =
    entity => {
        if (isLaterThan(entity.allowedToOpenUntil)) {
            return Future.of(entity);
        }
        return Future.reject({type: "thread-closed", reason: "Message thread is removed"});
    };
