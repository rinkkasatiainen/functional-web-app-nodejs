import {MessageThread} from "../message-thread";
import {timeToCalendar} from "../time";

export const applyMessageResponded:
    (x: Events.MessageResponded, y: MessageThread) => MessageThread =
    (event, entity) => {
        const {payload: {text}, time} = event;
        const messages = entity.messages || [];
        const alreadyAnsweredMessages = messages.slice(0, -1);
        const question = messages.slice(-1)[0].question;
        const draftResponse: OnDutyResponse = {
            text,
            time : timeToCalendar(time),
        };
        return {
            ...entity,
            messages: [...alreadyAnsweredMessages, {question, draftResponse}],
        };
    };
