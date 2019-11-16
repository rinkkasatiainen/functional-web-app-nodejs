import {
    CanApproveMessage,
    CanContinueMessageThread,
    CanCreateNewMessage,
} from "../../domain/commands/commands";

export as namespace Web

interface ActionOfType {
    [name: string]: Action | undefined;
}

export interface AllowedSeekerActions extends ActionOfType {
    [CanCreateNewMessage] ?: CanCreateNewMessageAction;
    // [CanLogout]: { path: "/admin/auth/logout", method: "GET" };
}

export interface AllowedMessageActions extends ActionOfType {
    [CanContinueMessageThread] ?: CanContinueMessageThreadAction;
    [CanApproveMessage] ?: CanApproveMessageAction;
}

export type CanApproveMessageAction = ActionBase<"POST">;
export type CanContinueMessageThreadAction = ActionBase<"POST">;
export type CanCreateNewMessageAction = ActionBase<"POST">;

export interface ActionBase<M extends HTTPMethod> {
    path: string;
    method: HTTPMethod;
    name: string;
    alert?: string;
}

export type HTTPMethod = "GET" | "POST";

// tslint:disable-next-line:no-any
export type Action = ActionBase<any>;
