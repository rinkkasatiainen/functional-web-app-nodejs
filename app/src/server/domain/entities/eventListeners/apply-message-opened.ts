import {CanMarkAsResponseRead} from "../../commands/commands";
import {MessageThread} from "../message-thread";
import {addDays} from "../time";
import {removeAction} from "./removeAction";

export const applyMessageOpened:
    (x: Events.MessageOpened, y: MessageThread) => MessageThread =
    (event, entity) => {
        const originalAllowedActions = entity.allowedActions || {};
        const {time} = event;
        return {
            ...entity,
            allowedActions: {
                ...removeAction([CanMarkAsResponseRead], originalAllowedActions),
            },
            allowedToOpenUntil: addDays(30)(time),
        };
    };
