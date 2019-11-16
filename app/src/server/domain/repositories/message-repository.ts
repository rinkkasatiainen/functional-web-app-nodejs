import Future from "fluture";

import {MessageThread} from "../entities/message-thread";

// tslint:disable:no-any
const allSaves:
    (e: DomainEvents.Stream ) =>
        (cb: (x: Events.DomainEvent<Events.Types, any>) => RepositoryAction<CommandStatus>) =>
            RepositoryAction<CommandStatus> =
    events => cb => events.reduce(
        (previousValue: RepositoryAction<CommandStatus>, event) => {
            return previousValue.and(cb(event));
        },
        Future.of({status: "internal-error", reason: "No commands executed"} ) as RepositoryAction<CommandStatus>,
    );
// tslint:enable:no-any

export const messageRepository: (x: EventStream) => (y: QuestionProjection) =>  MessageRepository =
    eventStream => questionProjection => ({
        addQuestion: streamId => {
            return questionProjection.addQuestion(streamId);
        },
        loadByStreamId: streamId => {
            return eventStream.loadById(streamId).chain(
                (stream) => {
                    return Future.of(MessageThread.for(streamId).load(stream));
                },
            ).mapRej(
                (error) => ({type: "repository error", reason: error.error}),
            );

        },
        save: (streamId) => (version) => message => {
            return allSaves(message.uncommittedChanges)(event => {
                // tslint:disable-next-line:no-console
                console.log("Saving event", {event});
                return eventStream.save(streamId, ++version, event);
            });
        },
    });

export const messageQueryRepository: (x: MessageRepository) =>  (y: Users) => Message.QueryRepository =
    persistentRepo => users => ({
        findMessage: (streamId) => {
            // TODO AkS: Should have more tests, if something fails on either of the repository calls!
            const userAccountDetails = users.getUser(streamId);

            const x = userAccountDetails
                .chain(
                    (userAccount: UserAccount) => {
                        return persistentRepo.loadByStreamId(streamId);
                    },
                );
            return x.mapRej( (err) => ({type: "Repository error", reason: err.reason }) );
        },
    });

export const messageCommandRepository: (x: MessageRepository) => Message.CommandRepository =
    persistentRepo => ({
        addQuestion: persistentRepo.addQuestion,
        save: persistentRepo.save,
    });
