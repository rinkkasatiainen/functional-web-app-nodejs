import {
    CanApproveMessage,
    CanContinueMessageThread,
    CanCreateNewMessage,
    CanLogout,
    CanPostAMessage,
    CanRemoveCommandForGood,
} from "../commands/commands";

export as namespace SeekerActions

interface Action {
    [name: string]: SeekerCommands.CommandDescription | undefined;
}

export interface AllowedSeekerActons extends AllowedActions {
    [CanLogout] ?: SeekerCommands.CommandDescription;
    [CanRemoveCommandForGood] ?: SeekerCommands.CommandDescription;
}

export interface AllowedMessageActions  extends AllowedActions {
    [CanPostAMessage]?: SeekerCommands.CommandDescription;
    [CanContinueMessageThread ]?: SeekerCommands.CommandDescription;
    [CanCreateNewMessage] ?: SeekerCommands.CommandDescription | undefined;
    [CanApproveMessage] ?: SeekerCommands.CommandDescription | undefined;
}
// tslint:disable-next-line:no-empty-interface
export interface AllowedActions extends Action {
}
