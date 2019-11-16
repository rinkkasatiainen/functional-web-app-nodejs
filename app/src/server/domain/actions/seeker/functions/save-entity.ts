import Future from "fluture";

const stripData: (y: Message.Entity) => MessageData =
    messageThread => {
        const {streamId, title, messages, version, allowedActions, allowedToOpenUntil} = messageThread;
        return {streamId, title, messages, version, allowedActions, allowedToOpenUntil};
    };

const asEntity: (y: Message.UncommittedEntity) => Message.Entity =
    messageThread => {
        const {
            streamId, title, messages, version, allowedActions, act, lastMessageSentAt, allowedToOpenUntil,
        } = messageThread;
        return {act, lastMessageSentAt, streamId, title, messages, version, allowedActions, allowedToOpenUntil};
    };

export const saveEntity:
    (y: Message.CommandRepository) =>
        (StreamId: StreamId) =>
            (message: Message.UncommittedEntity) =>
                RepositoryAction<MessageData> =
    repository => streamId => message => {
        return repository.save(streamId)(message.originalVersion)(message).and(
            Future.of(stripData(message)),
        );
    };

export const saveEntityAndReturnEntity:
    (y: Message.CommandRepository) =>
        (StreamId: StreamId) =>
            (message: Message.UncommittedEntity) =>
                RepositoryAction<Message.Entity> =
    repository => streamId => message => {
        return repository.save(streamId)(message.originalVersion)(message).and(
            Future.of(asEntity(message)),
        );
    };
