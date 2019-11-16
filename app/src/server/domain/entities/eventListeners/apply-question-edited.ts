import {
    CanApproveMessage,
    CanApproveMessageCommandDescription,
    CanEditMessage,
    CanEditMessageCommandDescription,
    CanPostAMessage,
} from "../../commands/commands";
import {History} from "../message-thread";
import {timeToCalendar} from "../time";
import {removeAction} from "./removeAction";

export const applyQuestionEdited: (x: Events.QuestionEdited, y: History) => History =
    (event, entity) => {
        const {payload: {title, text}, time} = event;
        const question: SeekerQuestion = {time: timeToCalendar(time), text};
        const originalMessages = entity.messages || [];
        const originalAllowedActions = entity.allowedActions || {};
        const alreadyAnsweredMessage = originalMessages.slice(0, -1);
        const newTitle = title ? title : entity.title;
        const messages = [...alreadyAnsweredMessage, {question} ];
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
            messages,
            title: newTitle,
        };
    };
