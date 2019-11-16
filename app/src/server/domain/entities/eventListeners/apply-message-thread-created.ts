import {
    CanApproveMessage,
    CanApproveMessageCommandDescription,
    CanEditMessage,
    CanEditMessageCommandDescription,
    CanPostAMessage,
} from "../../commands/commands";
import {defaultAllowedToReadUntil, History} from "../message-thread";
import {timeToCalendar} from "../time";
import {removeAction} from "./removeAction";

export const applyMessageThreadCreated: (x: Events.MessageThreadCreated, y: History) => History =
    (event, entity) => {
        const {payload: {title, text}, time} = event;
        const question: SeekerQuestion = {time: timeToCalendar(time), text};
        const originalAllowedActions = entity.allowedActions || {};
        const actions: SeekerActions.AllowedMessageActions = {
            [CanApproveMessage]: CanApproveMessageCommandDescription,
            [CanEditMessage]: CanEditMessageCommandDescription,
        };
        return {
            ...entity,
            allowedActions: {
                ...removeAction([CanPostAMessage], originalAllowedActions),
                ...actions,
            },
            allowedToOpenUntil: defaultAllowedToReadUntil,
            messages: [{question}],
            title,
        };
    };
