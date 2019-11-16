import {FutureInstance} from "fluture";

declare global {

    interface UserAccount {
        username: string;
        id: StreamId;
    }

    interface UserDb {
        findById: (x: StreamId) => FutureInstance<RepositoryError, UserAccount>;
        addStatistics: (x: StreamId)  => (y: Statistics) => FutureInstance<RepositoryError, CommandStatus>;
        removeAccount: (x: StreamId) => FutureInstance<RepositoryError, CommandStatus>;
    }
}
