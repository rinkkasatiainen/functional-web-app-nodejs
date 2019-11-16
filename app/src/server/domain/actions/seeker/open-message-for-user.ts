import Future, {FutureInstance} from "fluture";

import {validate} from "../../../helpers/chain";
import {devDebugLog} from "../../../helpers/development-debug";
import {toMaybe} from "../../../helpers/sanctuary/toMaybe";
import {
    CanCreateNewMessage,
    CanLogout,
    CanLogoutCommandDescription,
    CanRemoveCommandForGood, CreateNewMessageThreadCommandDescription,
    RemoveMessageThreadForGoodDescription,
} from "../../commands/commands";
import {isLaterThan, timeToCalendar} from "../../entities/time";
import {isAuthenticated, isAuthorized} from "../../validators/is-logged-in";
import {FutureResult} from "../action";
import {convertToResponse} from "../convert-to-response-entity";
import {saveEntityAndReturnEntity} from "./functions/save-entity";

const convertError: (x: { type: string }) => (y: string | Failure) => Failure =
// @ts-ignore
    hashToAdd => y => {
        if (typeof y === "string") {
            return {
                ...hashToAdd,
                reason: y,
            };
        } else {
            return y;
        }
    };
const allowedSeekerActions = {
    [CanLogout]: CanLogoutCommandDescription,
    [CanRemoveCommandForGood]: RemoveMessageThreadForGoodDescription,
};
const addAllSeekerActions: (x: MessageThreadProjection) => FutureInstance<DomainError, MessageThreadProjection> =
    messageEntity => Future.of({...messageEntity, allowedSeekerActions});

// @ts-ignore
const chainFutures = f => (original) => f.reduce(
// @ts-ignore
    (previousValue, func) => previousValue.chain(func),
    Future.of(original),
);

const markAsOpened:
    (x: Message.Entity) => FutureInstance<DomainError, Message.UncommittedEntity> =
    entity => entity.act.openedMessageThread();

const ensureCanOpen: (x: Message.Entity) => FutureInstance<DomainError, Message.Entity> =
    entity => {
        if ( isLaterThan(entity.allowedToOpenUntil) ) {
            return Future.of(entity);
        }
        return Future.reject({type: "thread-closed", reason: "Question removed"});
    };

const findMessage:
    (x: Message.QueryRepository) => (y: StreamId) => FutureInstance<Failure, Message.Entity> =
    repository => streamId => {
        return repository.findMessage(streamId)
            .mapRej(error => ({type: "internal", reason: error.reason}));
    };
const toProjection:
    (x: Message.Entity) => FutureInstance<Failure, Message.Projection> =
    messageThread => {
        const messageThreadProjection: Message.Projection = {
            allowedActions: {
                ...messageThread.allowedActions,
                [CanCreateNewMessage]: CreateNewMessageThreadCommandDescription,
            },
            allowedSeekerActions,
            allowedToOpenUntil: timeToCalendar(messageThread.allowedToOpenUntil),
            lastMessageSentAt: messageThread.lastMessageSentAt(),
            messageId: messageThread.streamId,
            messages: messageThread.messages,
            title: messageThread.title,
            type: "messageThread",
        } as Message.Projection;
        if (messageThread.messages.length === 0) {
            return Future.of(messageThreadProjection);
        }
        return Future.of({
            ...messageThreadProjection,
            allowedActions: messageThread.allowedActions,
        });
    };

export const openMessageForUser: (z: Message.Repository) => Message.OpenMessageAndLogReadingCommandHandler =
    repository => streamId => userAccountDetails => {

        devDebugLog("Debugging on openMessageForUser", {entry: {streamId, userAccountDetails}});
        const isValid = validate<LoginAccount.User>([
            isAuthenticated,
            isAuthorized(streamId),
        ])(toMaybe(userAccountDetails));

        return isValid.and(
            chainFutures([
                findMessage(repository),
                markAsOpened,
                ensureCanOpen,
                saveEntityAndReturnEntity(repository)(streamId),
                toProjection,
                addAllSeekerActions,
            ])(streamId),
        )
            .bimap(
                convertError({type: "503"}),
                convertToResponse,
            ) as FutureResult<Message.Projection>;
    };

export const getMessageForUser: (x: Message.QueryRepository) => Message.GetMessageQueryHandler =
    repository => streamId => userAccountDetails => {
        const isValid = validate<LoginAccount.User>([
            isAuthenticated,
            isAuthorized(streamId),
        ])(toMaybe(userAccountDetails));

        return isValid.and(
            chainFutures([
                findMessage(repository),
                toProjection,
                addAllSeekerActions,
            ])(streamId),
        )
            .bimap(
                convertError({type: "503"}),
                convertToResponse,
            ) as FutureResult<Message.Projection>;
    };
