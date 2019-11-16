import Future, {FutureInstance} from "fluture";
import * as S from "sanctuary";
import {ChainableFunction, validateM} from "../../../helpers/chain";

import {toMaybe} from "../../../helpers/sanctuary/toMaybe";
import {isAuthenticated, isAuthorized} from "../../validators/is-logged-in";
import {convertToResponse} from "../convert-to-response-entity";

const convertError: (x: { type: string }) => (y: DomainErrorsTypes | Failure) => Failure =
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

const editMessageThread:
    (y: EditAQuestionCommand) => (x: MessageEntity) => FutureInstance<DomainError, UncommittedMessageEntity> =
    command => message => message.act.editMessage(command);

const postAMessage:
    (y: PostAQuestionCommand) => (x: MessageEntity) => FutureInstance<DomainError, UncommittedMessageEntity> =
    command => message => message.act.postAMessage(command);

const approveAMessage:
    (y: ApproveMessageCommand) => (x: MessageEntity) => FutureInstance<DomainError, UncommittedMessageEntity> =
    command => message => message.act.approveAMessage(command);

const createNewMessageThread:
    (y: CreateNewThreadCommand) => (x: MessageEntity) => FutureInstance<DomainError, UncommittedMessageEntity> =
    command => message => message.act.createNewMessageThread(command);

// FIXME AkS: Make tests for this!!!!
const isValidMessage: (x: PostAQuestionCommand) => ChainableFunction<LoginAccount.User> =
    command => user => S.Right(command);

const findMessage:
    (y: MessageRepository) =>
        (streamId: StreamId) =>
            RepositoryResult<MessageEntity> =
    repository => streamId => repository.loadByStreamId(streamId);

const stripData: (y: MessageEntity) => MessageData =
    messageThread => {
        const {streamId, title, messages, version, allowedActions, allowedToOpenUntil} = messageThread;
        return {streamId, title, messages, version, allowedActions, allowedToOpenUntil};
    };

const saveEntity:
    (y: MessageRepository) =>
        (StreamId: StreamId) =>
            (message: UncommittedMessageEntity) =>
                RepositoryAction<MessageData> =
    repository => streamId => message => {
        return repository.save(streamId)(message.originalVersion)(message).and(
            Future.of(stripData(message)),
        );
    };

function addQuestion<T>(messageRepository: MessageRepository): (y: StreamId) => (z: T) => RepositoryAction<T> {
    return streamId => entity => {
        return messageRepository.addQuestion(streamId).and(
            Future.of(entity),
        );
    };
}

function addStatistics<T>(users: Users): (x: StreamId) => (y: Statistics) => (z: T) => RepositoryAction<T> {
    return streamId => statistics => entity  => {
        return users.addStatistics(streamId)(statistics).and(
            Future.of(entity),
        );
    };
}

const toStatus: (message: string) => (x: MessageData) => RepositoryAction<CommandStatus> =
    text => entity => Future.of({status: "created", text});

// @ts-ignore
const chainFutures = f => (original) => f.reduce(
// @ts-ignore
    (previousValue, func) => previousValue.chain(func),
    Future.of(original),
);

// @ts-ignore
const chainFuturesA = f => (original) => () => f.reduce(
// @ts-ignore
    (previousValue, func) => previousValue.chain(func),
    Future.of(original),
);

export const postMessage: (x: MessageRepository) => PostMessageCommandHandler =
    repository => streamId => command => userAccountDetails => {
        const isValid = validateM<LoginAccount.User, CommandStatus>([
            isAuthenticated,
            isAuthorized(streamId),
            isValidMessage(command),
        ])(toMaybe(userAccountDetails));

        return isValid.andThen([
                findMessage(repository),
                postAMessage(command),
                saveEntity(repository)(streamId),
                addQuestion(repository)(streamId),
                toStatus("Question requires approval. Please approve it!"),
            ])(streamId)
            .bimap(
                convertError({type: "501"}),
                convertToResponse,
            );
    };

export const approveMessage: (x: MessageRepository) => ApproveMessageCommandHandler =
    repository => streamId => command => userAccountDetails => {
        const isValid = validateM<LoginAccount.User, CommandStatus>([
            isAuthenticated,
            isAuthorized(streamId),
        ])(toMaybe(userAccountDetails));

        return isValid.andThen([
                findMessage(repository),
                approveAMessage(command),
                saveEntity(repository)(streamId),
                addQuestion(repository)(streamId),
                toStatus("Message is now posted to the service"),
            ])(streamId)
            .bimap(
                convertError({type: "501"}),
                convertToResponse,
            );
    };
export const editMessage: (x: MessageRepository) => EditMessageThreadCommandHandler =
    repository => streamId => command => userAccountDetails => {
        const isValid = validateM<LoginAccount.User, CommandStatus>([
            isAuthenticated,
            isAuthorized(streamId),
            isValidMessage(command),
        ])(toMaybe(userAccountDetails));

        return isValid.andThen([
                findMessage(repository),
                editMessageThread(command),
                saveEntity(repository)(streamId),
                addQuestion(repository)(streamId),
                toStatus("Question is modified and requires your approval."),
            ])(streamId)
            .bimap(
                convertError({type: "5001"}),
                convertToResponse,
            );
    };

export const createNewThread: (x: MessageRepository) =>  (y: Users) => CreateNewMessageThreadCommandHandler =
    repository => users => streamId => command => userAccountDetails => {
        const isValid = validateM<LoginAccount.User, CommandStatus>([
            isAuthenticated,
            isAuthorized(streamId),
            isValidMessage(command),
        ])(toMaybe(userAccountDetails));

        return isValid.andThen([
                findMessage(repository),
                createNewMessageThread(command),
                saveEntity(repository)(streamId),
                addStatistics(users)(streamId)(command.statistics),
                addQuestion(repository)(streamId),
                toStatus("Question requires your approval."),
            ])(streamId)
            .bimap(
                convertError({type: "501"}),
                convertToResponse,
            );
    };
