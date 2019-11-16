import {MessageThread} from "../message-thread";

export const removeAction:
    (keys: string[], obj: SeekerActions.AllowedMessageActions) => SeekerActions.AllowedMessageActions =
    (actionList, actions) => Object.keys(actions)
        .filter((key) => actionList.indexOf(key) < 0)
        .reduce((newObj, key) => Object.assign(newObj, {[key]: actions[key]}), {});

type possibleKey = "reservedFor" | "allowedActions" | "reservedToLocation";

export const removeKey:
    (keys: possibleKey[], obj: MessageThread) => MessageThread =
    // @ts-ignore
    (properties, messageThread) => Object.keys(messageThread)
        // @ts-ignore
        .filter((key) => properties.indexOf(key) < 0)
        // @ts-ignore
        .reduce((newObj, key) => Object.assign(newObj, {[key]: messageThread[key]}), {});
