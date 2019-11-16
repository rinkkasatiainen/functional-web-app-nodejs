import Future from "fluture";
import {
    CanCreateNewMessage,
    CanLogout,
    CanLogoutCommandDescription, CanRemoveCommandForGood,
    CreateNewMessageThreadCommandDescription, RemoveMessageThreadForGoodDescription,
} from "../commands/commands";

export const findMessageQueryHandler:
    (x: Users) => (y: MessageQueryRepository) => MessageFromRepository<MessageThreadProjection> =
    Users => messages => streamId => {
        // TODO AkS: Should have more tests, if something fails on either of the repository calls!
        const userAccountDetails = Users.getUser(streamId);
        const allowedSeekerActions = {
            [CanLogout]: CanLogoutCommandDescription,
            [CanRemoveCommandForGood]: RemoveMessageThreadForGoodDescription,
        };

        const x = userAccountDetails
            .chain(
                (entity: UserAccount) => {
                    return messages.loadByStreamId(streamId).map(e => ({...entity, ...e}));
                },
            ).chain(
                (messageThread: MessageEntity) => {
                    const messageThreadProjection: MessageThreadProjection = {
                        allowedActions: {
                            ...messageThread.allowedActions,
                            [CanCreateNewMessage]: CreateNewMessageThreadCommandDescription,
                        },
                        allowedSeekerActions,
                        lastMessageSentAt: messageThread.lastMessageSentAt(),
                        messageId: messageThread.streamId,
                        messages: messageThread.messages,
                        title: messageThread.title,
                        type: "messageThread",
                    } as MessageThreadProjection;
                    if (messageThread.messages.length === 0) {
                        return Future.of(messageThreadProjection )
                        ;
                    }
                    return Future.of({
                        ...messageThreadProjection,
                        allowedActions: messageThread.allowedActions,
                    });
                },
            );
        return x.bimap(
            // tslint:disable-next-line:no-any
            (err: any) => ({type: "Repository error", err}),
            // tslint:disable-next-line:no-any
            (entity: MessageThreadProjection) => {
                return {
                    allowedActions: entity.allowedActions,
                    lastMessageSentAt: entity.lastMessageSentAt,
                    messageId: streamId,
                    messages: entity.messages,
                    title: entity.title || "",
                    type: "messages-from-repository",
                };
            },
        );
    };
