import {
    CanApproveMessage,
    CanContinueMessageThread,
    CanEditMessage,
    CanLogout,
    CanRemoveCommandForGood,
} from "../../../domain/commands/commands";

const actions: Web.ActionOfType = {
    [CanLogout]: {path: "/auth/logout", method: "GET", name: "Logout"},
    [CanContinueMessageThread]: {
        method: "GET",
        name: "Continue Message Thread",
        path: "/question/<streamId>/continue",
    },
    [CanRemoveCommandForGood]: {
        alert: "Are you sure, you cannot change your decision!",
        method: "POST",
        name: "Remove question for good!",
        path: "/question/<streamId>/remove",
    },
    [CanApproveMessage]: {
        method: "POST",
        name: "Approve questiong",
        path: "/question/<streamId>/approve",
    },
    [CanEditMessage]: {
        method: "GET",
        name: "Back",
        path: "/question/<streamId>/continue",
    },
};

export const isKnownAction: (x: string) => boolean =
    actionName => actionName in actions;

export const mapActions: (x: string) => Web.Action =
    (actionName: string) => {
        return actions[actionName] as Web.Action;
    };
