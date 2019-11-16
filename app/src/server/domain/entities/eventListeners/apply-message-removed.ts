import {MessageThread} from "../message-thread";
import {yesterday} from "../time";

export const applyMessageRemoved:
    (x: Events.MessageRemoved, y: MessageThread) => MessageThread =
    (event, entity) => {
        return {
            ...entity,
            allowedActions: { },
            allowedToOpenUntil: yesterday(),
        };
    };
