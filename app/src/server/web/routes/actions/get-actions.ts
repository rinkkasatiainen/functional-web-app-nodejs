import {isKnownAction, mapActions} from "./action-mapper";

interface ReplaceWith { streamId?: string; locationId?: string | number ; locationName?: string; }

const replaceAll: (x: string, y: ReplaceWith) => string =
    (str, obj) => {
        let result = str;
        for ( const [key, value] of Object.entries(obj) ) {
            result = result.replace(`<${key}>`, value);
        }
        return result;
    };

export function toWebActions
    <T extends SeekerActions.AllowedSeekerActons, U extends Web.AllowedSeekerActions >(replaceWith: ReplaceWith):
    (y: T) => U {
    return adminActions => {
        // @ts-ignore
        const actions: U = {};
        for (const [actionName] of Object.entries(adminActions)) {
            if (isKnownAction(actionName)) {
                const action = mapActions(actionName);
                const path = replaceAll(action.path, replaceWith);
                const name = replaceAll(action.name, replaceWith);
                // @ts-ignore
                actions[actionName] = {...action, path, name};
            }
        }
        return actions;
    };
}
