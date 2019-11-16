import Future from "fluture";
import {CanCreateNewMessage, CreateNewMessageThreadCommandDescription} from "../commands/commands";

export const openMessageToContinueAction:
    (x: Users) => (y: MessageQueryRepository) => MessageFromRepository<MessageThreadProjection> =
    Users => messages => streamId => {
        // FIXME AkS: Should have more tests, if something fails on either of the repository calls!
        const userAccountDetails = Users.getUser(streamId);

        const x = userAccountDetails
            .chain(
                (entity: UserAccount) => {
                    return messages.loadByStreamId(streamId).map(e => ({...entity, ...e}));
                },
            ).chain(
                (messageThread: MessageEntity) => {
                    if (messageThread.messages.length === 0) {
                        return Future.of(
                            {
                                ...messageThread,
                                allowedActions: {[CanCreateNewMessage]: CreateNewMessageThreadCommandDescription},
                            });
                    }
                    return Future.of(messageThread);
                },
            );
        return x.bimap(
            err => ({type: "Repository error", err}),
            entity => {
                return {
                    allowedActions: entity.allowedActions,
                    lastMessageSentAt: entity.lastMessageSentAt(),
                    messageId: streamId,
                    messages: entity.messages,
                    title: entity.title || "",
                    type: "messages-from-repository",
                };
            },
        );
    };
