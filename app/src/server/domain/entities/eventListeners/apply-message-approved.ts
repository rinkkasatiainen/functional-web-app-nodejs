import {
    CanContinueMessageThread,
    CanContinueMessageThreadDescription,
    CanContinueThread,
    CanMarkAsResponseRead,
    CanMarkAsResponseReadDescription,
} from "../../commands/commands";
import {MessageThread} from "../message-thread";
import {addDays, now} from "../time";

export const applyResponseApproved:
    (x: Events.ResponseApproved, y: MessageThread) => MessageThread =
    (event, entity) => {
        const messages = entity.messages || [];
        const alreadyAnsweredMessages = messages.slice(0, -1);
        const {question, draftResponse} = messages.slice(-1)[0];
        return {
            ...entity,
            allowedActions: {
                [CanContinueMessageThread]: CanContinueMessageThreadDescription,
                [CanContinueThread] : CanContinueMessageThreadDescription,
                [CanMarkAsResponseRead]: CanMarkAsResponseReadDescription,
            },
            allowedToOpenUntil: addDays(60)(now()),
            messages: [...alreadyAnsweredMessages, {question, response: draftResponse}],
        };
    };
