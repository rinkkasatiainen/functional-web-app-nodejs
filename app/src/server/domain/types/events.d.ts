import {
    MessageOpenedType, MessageRemovedType,
    MessageRespondedType,
    MessageThreadContinuedType,
    MessageThreadCreatedType, QuestionApprovedType, QuestionEditedType,
    ResponseApprovedType, StatisticsAddedType,
} from "../events/events";

export as namespace Events

export type Types =
    typeof MessageThreadCreatedType |
    typeof MessageThreadContinuedType |
    typeof MessageOpenedType |
    typeof MessageRemovedType |
    typeof MessageRespondedType |
    typeof StatisticsAddedType |
    typeof QuestionEditedType |
    typeof QuestionApprovedType |
    typeof ResponseApprovedType ;

export interface DomainEvent<T extends Types, U> {
    time: number;
    type: T;
    payload: U;
}
interface Statistics {
    age: 1 | 2 | 3 | 4 | 5 | 6;
    area: 1 | 2 | 3;
    relation: 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9;
}

type StatisticsAddedEvent<T> = DomainEvent<"StatisticsAdded", T>;
export type StatisticsAdded = StatisticsAddedEvent<Statistics>;

// @ts-ignore
type MessageThreadCreatedEvent<T> = DomainEvent<"MessageThreadCreated", T>;
interface MessageThreadCreatedPayload {
    title: string;
    text: string;
}
export type MessageThreadCreated = MessageThreadCreatedEvent<MessageThreadCreatedPayload>;

type QuestionEditedEvent<T> = DomainEvent<"QuestionEdited", T>;
interface QuestionEditedPayload {
    title?: string;
    text: string;
}
export type QuestionEdited = QuestionEditedEvent<QuestionEditedPayload>;

type QuestionApprovedEvent<T> = DomainEvent<"QuestionApproved", T>;
export type QuestionApproved = QuestionApprovedEvent<{}>;

type MessageThreadContinuedEvent<T> = DomainEvent<"MessageThreadContinued", T>;
interface MessageThreadContinuedPayload {
    text: string;
}
export type MessageThreadContinued = MessageThreadContinuedEvent<MessageThreadContinuedPayload>;

type MessageRespondedEvent<T> = DomainEvent<"MessageResponded", T>;
interface MessageThreadRespondedPayload {
    text: string;
}
export type MessageResponded = MessageRespondedEvent<MessageThreadRespondedPayload>;

type ResponseApprovedEvent<T> = DomainEvent<"ResponseApproved", T>;
export type ResponseApproved = ResponseApprovedEvent<{}>;

type MessageOpenedEvent<T> = DomainEvent<"MessageOpened", T>;
export type MessageOpened = MessageOpenedEvent<{}>;

type MessageRemovedEvent<T> = DomainEvent<"MessageRemoved", T>;
export type MessageRemoved = MessageRemovedEvent<{}>;
