import {now} from "../server/domain/entities/time";
import {
    MessageOpenedType,
    MessageRespondedType,
    MessageThreadCreatedType,
    QuestionApprovedType,
    ResponseApprovedType,
} from "../server/domain/events/events";

const title = "Any title anyone could have";
const text = "Any text anyone could have";
const responseText = "Any response anyone could have";

// tslint:disable-next-line:no-any
export const firstMessageCreated: Events.MessageThreadCreated = {
    payload: {title, text}, time: now(), type: MessageThreadCreatedType,
};

export const firstMessageApproved: Events.QuestionApproved = {
    payload: {}, time: now(), type: QuestionApprovedType,
};

export const responded: Events.MessageResponded = {
    payload: {text: responseText}, time: now(), type: MessageRespondedType,
};

export const responseApproved: Events.ResponseApproved = {
    payload: {}, time: now(), type: ResponseApprovedType,
};

export const messageOpened: Events.MessageOpened = {
    payload: {}, time: now(), type: MessageOpenedType,
};
