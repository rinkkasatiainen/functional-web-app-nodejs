import Future, {FutureInstance} from "fluture";
import {Moment} from "moment";
import {
    CanContinueThread,
    CanEditMessage, CanMarkAsResponseRead,
    CanPostAMessage,
    CreateNewMessageThreadCommandDescription,
} from "../commands/commands";
import {
    MessageOpenedType, MessageRemovedType,
    MessageRespondedType, MessageThreadContinuedType,
    MessageThreadCreatedType, QuestionApprovedType, QuestionEditedType, ResponseApprovedType, StatisticsAddedType,
} from "../events/events";
import {applyResponseApproved} from "./eventListeners/apply-message-approved";
import {applyMessageOpened} from "./eventListeners/apply-message-opened";
import {applyMessageRemoved} from "./eventListeners/apply-message-removed";
import {applyMessageThreadContinued} from "./eventListeners/apply-message-thread-continued";
import {applyMessageThreadCreated} from "./eventListeners/apply-message-thread-created";
import {applyQuestionApproved} from "./eventListeners/apply-question-approved";
import {applyQuestionEdited} from "./eventListeners/apply-question-edited";
import {applyMessageResponded} from "./eventListeners/applyMessageResponded";
import {addDays, now} from "./time";

const CreateNewMessageThread:
    (x: MessageThread) => (y: CreateNewThreadCommand) => FutureInstance<DomainError, UncommittedMessageEntity> =
    entity => command => {
        if (CanPostAMessage in entity.allowedActions) {
            const {version: originalVersion} = entity;
            const statisticsAdded: Events.StatisticsAdded = {
                payload: {
                    ...command.statistics,
                },
                time: now(),
                type: StatisticsAddedType,
            };
            const messageThreadCreated: Events.MessageThreadCreated = {
                payload: {
                    text: command.text,
                    title: command.title,
                },
                time: now(),
                type: MessageThreadCreatedType,
            };
            const newEntity = applyNewEvent(statisticsAdded, applyNewEvent(messageThreadCreated, entity));

            return Future.of({
                ...newEntity,
                originalVersion,
                uncommittedChanges: [messageThreadCreated, statisticsAdded],
            });
        }
        return Future.reject({
            reason: `Message with ${entity.streamId} cannot perform action 'Create new Message'`,
            type: "Domain Error",
        });
    };

const EditAMessageAct:
    (x: MessageThread) => (y: EditAQuestionCommand) => FutureInstance<DomainError, UncommittedMessageEntity> =
    entity => command => {
        if (CanEditMessage in entity.allowedActions) {
            const {version: originalVersion} = entity;
            const event: Events.QuestionEdited = {
                payload: {
                    text: command.text,
                    title: command.title,
                },
                time: now(),
                type: QuestionEditedType,
            };
            const newEntity = applyNewEvent(event, entity);
            return Future.of({...newEntity, uncommittedChanges: [event], originalVersion});
        }
        return Future.reject({
            reason: `Message with ${entity.streamId} cannot perform action 'PostAMessage'`,
            type: "Domain Error",
        });

    };
const ApproveAMessageAct:
    (x: MessageThread) => (y: ApproveMessageCommand) => FutureInstance<DomainError, UncommittedMessageEntity> =
    entity => () => {
        if (CanEditMessage in entity.allowedActions) {
            const {version: originalVersion} = entity;
            const event: Events.QuestionApproved = {
                payload: {},
                time: now(),
                type: QuestionApprovedType,
            };
            const newEntity = applyNewEvent(event, entity);
            return Future.of({...newEntity, uncommittedChanges: [event], originalVersion});
        }
        return Future.reject({
            reason: `Message with ${entity.streamId} cannot perform action 'ApproveMessage'`,
            type: "Domain Error",
        });

    };
const PostAMessageAct:
    (x: MessageThread) => (y: PostAQuestionCommand) => FutureInstance<DomainError, UncommittedMessageEntity> =
    entity => command => {
        if (CanContinueThread in entity.allowedActions) {
            const {version: originalVersion} = entity;
            const event: Events.MessageThreadContinued = {
                payload: {
                    text: command.text,
                },
                time: now(),
                type: MessageThreadContinuedType,
            };
            const newEntity = applyNewEvent(event, entity);
            return Future.of({...newEntity, uncommittedChanges: [event], originalVersion});
        }

        if (CanPostAMessage in entity.allowedActions) {
            const {version: originalVersion} = entity;
            const messageThreadCreated: Events.MessageThreadCreated = {
                payload: {
                    text: command.text,
                    title: command.title,
                },
                time: now(),
                type: MessageThreadCreatedType,
            };
            const newEntity = applyNewEvent(messageThreadCreated, entity);
            return Future.of({...newEntity, uncommittedChanges: [messageThreadCreated], originalVersion});
        }
        return Future.reject({
            reason: `Message with ${entity.streamId} cannot perform action 'PostAMessage'`,
            type: "Domain Error",
        });

    };
const MarkMessageAsOpenedAct:
    (x: MessageThread) => () => FutureInstance<DomainError, UncommittedMessageEntity> =
    entity => () => {
        const {version: originalVersion} = entity;
        if (CanMarkAsResponseRead in entity.allowedActions) {
            const event: Events.MessageOpened = {
                payload: {},
                time: now(),
                type: MessageOpenedType,
            };
            const newEntity = applyNewEvent(event, entity);
            return Future.of({...newEntity, uncommittedChanges: [event], originalVersion});
        }
        return Future.of({...entity, originalVersion, uncommittedChanges: []});
    };
const MarkAsRemoved:
    (x: MessageThread) => () => FutureInstance<DomainError, UncommittedMessageEntity> =
    entity => () => {
        const {version: originalVersion} = entity;
        const event: Events.MessageRemoved = {
            payload: {},
            time: now(),
            type: MessageRemovedType,
        };
        const newEntity = applyNewEvent(event, entity);
        return Future.of({...newEntity, uncommittedChanges: [event], originalVersion});
    };

// tslint:disable-next-line:no-any
const DomainActions: { for: (x: any) => MessageBehavior } = {
    for: (messageThread: MessageThread) => ({
        approveAMessage: ApproveAMessageAct(messageThread),
        createNewMessageThread: CreateNewMessageThread(messageThread),
        editMessage: EditAMessageAct(messageThread),
        markAsRemoved: MarkAsRemoved(messageThread),
        openedMessageThread: MarkMessageAsOpenedAct(messageThread),
        postAMessage: PostAMessageAct(messageThread),
    }),
};
export const defaultAllowedToReadUntil = addDays(60)(now());

export class MessageThread implements Message.Entity {
    public static build(x: { streamId: StreamId, history: History }) {
        return new MessageThread(x.streamId, x.history);
    }

    public static for(streamId: StreamId) {
        return {
            load: (events: DomainEvents.Stream) => new MessageThread(streamId, loadHistory(events)),
        };
    }

    public readonly allowedActions: SeekerActions.AllowedMessageActions;
    public readonly messages: QuestionResponse[];
    public readonly streamId: StreamId;
    public readonly title: string;
    public readonly version: number;
    public readonly allowedToOpenUntil: Moment;

    public act = DomainActions.for(this);

    private constructor(streamId: StreamId, h: History) {
        const {messages, version, title, allowedActions, allowedToOpenUntil} = h;
        this.messages = messages || [];
        this.streamId = streamId;
        this.title = title || "";
        this.version = version;
        this.allowedActions = allowedActions || {[CanPostAMessage]: CreateNewMessageThreadCommandDescription};
        this.allowedToOpenUntil = allowedToOpenUntil || defaultAllowedToReadUntil;
    }

    public lastMessageSentAt = () => {
        return this.messages.length === 0 ?
            "" :
            this.messages.slice(-1)[0].question.time;
    }
}

export interface History {
    allowedActions: SeekerActions.AllowedMessageActions;
    allowedToOpenUntil?: Moment;
    messages?: QuestionResponse[];
    streamId?: StreamId;
    title?: string;
    version: number;
}

const typeListeners = new Map();
for (const [key, value] of Object.entries({
    [MessageThreadCreatedType]: applyMessageThreadCreated,
    [MessageRespondedType]: applyMessageResponded,
    [MessageRemovedType]: applyMessageRemoved,
    [MessageOpenedType]: applyMessageOpened,
    [ResponseApprovedType]: applyResponseApproved,
    [MessageThreadContinuedType]: applyMessageThreadContinued,
    [QuestionEditedType]: applyQuestionEdited,
    [QuestionApprovedType]: applyQuestionApproved,
})) {
    typeListeners.set(key, value);
}

// tslint:disable-next-line:no-any
const applyNewEvent: (x: Events.DomainEvent<Events.Types, any>, y: DomainEntity) => MessageEntity =
    (event, entity) => {
        if (typeListeners.has(event.type)) {
            return {...typeListeners.get(event.type)(event, entity), version: entity.version + 1};
        }
        return entity as History;
    };

// tslint:disable-next-line:no-any
const applyHistory: (x: Events.DomainEvent<Events.Types, any>, y: History) => History =
    (event, entity) => {
        if (typeListeners.has(event.type)) {
            return typeListeners.get(event.type)(event, entity);
        }
        return entity as History;
    };

const loadHistory: (x: DomainEvents.Stream) => History =
    events => {
        const data = events.reduce(
            // @ts-ignore
            (carry, event) => ({...applyHistory(event, carry), version: carry.version + 1}),
            {version: 0},
        );
        return data as History;
    };
