import {FutureInstance} from "fluture";
import {validateM} from "../../../helpers/chain";
import {toMaybe} from "../../../helpers/sanctuary/toMaybe";
import {DomainFailure} from "../../types/errors";
import {isAuthenticated, isAuthorized} from "../../validators/is-logged-in";
import {convertToResponse} from "../convert-to-response-entity";
import {findMessage} from "./functions/find-message";
import {saveEntity} from "./functions/save-entity";
import {toStatus} from "./functions/to-status";

const removeMessage: (x: MessageEntity) => FutureInstance<DomainFailure<"internal">, Message.UncommittedEntity> =
    entity => entity.act.markAsRemoved().mapRej(error => ({type: "internal", reason: error.type}) );

const removeAccount: (x: RemoveAccount) => (y: StreamId) => (z: MessageEntity) => RepositoryAction<CommandStatus> =
    users => streamId => entity => {
        return users.removeAccount(streamId);
    };

export const removeMessageThread:
    (x: Message.Repository) => (y: RemoveAccount) => Message.RemoveThreadForeverCommandHandler =
    messageRepository => users => streamId => userAccountDetails => {
        const isValid = validateM<LoginAccount.User, CommandStatus>([
            isAuthenticated,
            isAuthorized(streamId),
        ])(toMaybe(userAccountDetails));

        return isValid.andThen([
            findMessage(messageRepository),
            removeMessage,
            saveEntity(messageRepository)(streamId),
            removeAccount(users)(streamId),
            toStatus("Question is removed, user is no longer in the system!"),
        ])(streamId)
            .map(
                convertToResponse,
            );
    };
