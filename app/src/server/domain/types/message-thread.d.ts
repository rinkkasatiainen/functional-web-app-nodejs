import {FutureResult} from "../actions/action";

export as namespace Message

export interface Projection {
    messageId: StreamId;
    messages: QuestionResponse[];
    title: string;
    allowedActions: SeekerActions.AllowedMessageActions;
    allowedToOpenUntil: string;
    allowedSeekerActions?: SeekerActions.AllowedSeekerActons;
    lastMessageSentAt: string;
}

export interface ForUser {
    allowedToOpenUntil: string;
    lastMessageSentAt: string;
    messages: QuestionResponse[];
    streamId: StreamId;
    title: string;
}

export type Entity = MessageEntity;
type UncommittedEntity = UncommittedMessageEntity;

export interface PersistentRepository {
    loadByStreamId: (x: StreamId) => RepositoryResult<Entity>;
    save: (x: StreamId) => (version: number) => (z: UncommittedEntity) => RepositoryAction<CommandStatus>;
}

export interface QueryRepository {
    findMessage: (x: StreamId) => RepositoryResult<Entity>;
}
export interface CommandRepository {
    addQuestion: (x: StreamId) => RepositoryAction<CommandStatus>;
    save: (x: StreamId) => (version: number) => (z: UncommittedDomainEntity) => RepositoryAction<CommandStatus>;
}
export interface Repository extends QueryRepository, CommandRepository {
}

// Query Handlers
export type GetMessageQueryHandler =
    (x: StreamId) => (y?: LoginAccount.User) => FutureResult<Projection>;

// Command Handlers
export type OpenMessageAndLogReadingCommandHandler =
    (y: StreamId) => (z?: LoginAccount.User) => FutureResult<Projection>;

export type RemoveThreadForeverCommandHandler =
    (y: StreamId) => (z?: LoginAccount.User) => FutureResult<CommandStatus>;
