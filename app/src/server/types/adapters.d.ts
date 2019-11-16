import {FutureInstance} from "fluture";
import {StreamId} from "../domain/actions/streamId";

declare global {
    interface Adapters {
        uuidProvider: () => FutureInstance<string, StreamId>;
        limit: Settings.Limit;
    }

    interface Actions {
        // Commands
        approveMessageCommandHandler: ApproveMessageCommandHandler;
        createNewMessageCommandHandler: CreateNewMessageThreadCommandHandler;
        editMessageCommandHandler: EditMessageThreadCommandHandler;
        openMessageCommandHandler: Message.OpenMessageAndLogReadingCommandHandler;
        postMessageCmdHandler: PostMessageCommandHandler;
        removeThreadForeverCommandHandler: Message.RemoveThreadForeverCommandHandler;
        // QueryHandlers
        getMessageQueryHandler: Message.GetMessageQueryHandler;
    }
}
