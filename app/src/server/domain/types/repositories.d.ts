import {FutureInstance} from "fluture";

declare global {
    type RepositoryResult<T extends DomainEntity> = FutureInstance<RepositoryError, T>;
    type RepositoryAction<T> = FutureInstance<RepositoryError, T>;

    interface RepositoryError {
        type: string;
        reason: string;
    }

    interface Users {
        getUsername: (x: StreamId) => FutureInstance<RepositoryError, string>;
        getUser: (x: StreamId) => FutureInstance<RepositoryError, UserAccount>;
        addStatistics: (x: StreamId) => (statistics: Statistics) => FutureInstance<RepositoryError, CommandStatus>;
    }

    interface MessageQueryRepository {
        loadByStreamId: (x: StreamId) => RepositoryResult<MessageEntity>;
    }

    interface MessageRepository extends MessageQueryRepository {
        save: (x: StreamId) => (version: number) => (z: UncommittedDomainEntity) => RepositoryAction<CommandStatus>;
        addQuestion: (x: StreamId) => RepositoryAction<CommandStatus>;
    }

    interface RemoveAccount {
        removeAccount: (x: StreamId) => RepositoryAction<CommandStatus>;
    }
}
