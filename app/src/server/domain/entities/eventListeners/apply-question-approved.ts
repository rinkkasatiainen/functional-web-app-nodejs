import {
    CanApproveMessage,
    CanEditMessage,
} from "../../commands/commands";
import {History} from "../message-thread";
import {removeAction} from "./removeAction";

export const applyQuestionApproved: (x: Events.QuestionEdited, y: History) => History =
    (event, entity) => {
        const originalAllowedActions = entity.allowedActions || {};
        return {
            ...entity,
            allowedActions: {
                ...removeAction([CanApproveMessage, CanEditMessage], originalAllowedActions),
            },
        };
    };
