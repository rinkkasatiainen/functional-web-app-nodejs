import {
    CanApproveMessage,
    CanApproveMessageCommandDescription,
    CanEditMessage,
    CanEditMessageCommandDescription,
} from "../../commands/commands";
import {MessageThread} from "../message-thread";
import {addDays, now, timeToCalendar} from "../time";

export const applyMessageThreadContinued: (x: Events.MessageThreadContinued, y: MessageThread) => MessageThread =
    (event, entity) => {
        const {payload: {text}, time} = event;
        const {messages: originalMessases} = entity;
        const question: SeekerQuestion = {time: timeToCalendar(time), text};
        const actions: SeekerActions.AllowedMessageActions = {
            [CanApproveMessage]: CanApproveMessageCommandDescription,
            [CanEditMessage]: CanEditMessageCommandDescription,
        };
        return {
            ...entity,
            allowedActions: {...actions},
            allowedToOpenUntil: addDays(60)(now()),
            messages: [...originalMessases, {question}],
        };
    };
