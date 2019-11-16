import {FutureInstance} from "fluture";

declare global {
    interface Statistics {
        age: 1 | 2 | 3 | 4 | 5 | 6;
        area: 1 | 2 | 3;
        relation: 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9;
    }

    interface CreateNewThreadCommand {
        id: StreamId;
        text: string;
        title: string;
        statistics: Statistics;
    }

    interface EditAQuestionCommand {
        id: StreamId;
        text: string;
        title: string;
    }
    interface ApproveMessageCommand {
        id: StreamId;
    }
    interface PostAQuestionCommand {
        id: StreamId;
        text: string;
        title: string;
    }

    type CreateNewMessageThreadCommandHandler =
        (pageUuid: StreamId) =>
            (y: CreateNewThreadCommand) =>
                (x?: LoginAccount.User) =>
                    FutureInstance<Failure, Success<CommandStatus>>;
    type EditMessageThreadCommandHandler =
        (pageUuid: StreamId) =>
            (y: EditAQuestionCommand) =>
                (x?: LoginAccount.User) =>
                    FutureInstance<Failure, Success<CommandStatus>>;
    type ApproveMessageCommandHandler =
        (pageUuid: StreamId) =>
            (y: ApproveMessageCommand) =>
                (x?: LoginAccount.User) =>
                    FutureInstance<Failure, Success<CommandStatus>>;

    type PostMessageCommandHandler =
        (pageUuid: StreamId) =>
            (y: PostAQuestionCommand) =>
                (x?: LoginAccount.User) =>
                    FutureInstance<Failure, Success<CommandStatus>>;
}
