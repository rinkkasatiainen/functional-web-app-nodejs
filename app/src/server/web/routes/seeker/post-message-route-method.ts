import {Request, Response} from "express";
import {FutureResult} from "../../../domain/actions/action";
import {executeInFuture, handle} from "../result/handle-future";
import {logEntry} from "../result/log-entry";
import {redirectOnSuccess, redirectTo} from "../result/redirect-to";
import {reportCommandSuccess, reportErrors} from "../result/report-errors";

export type ApproveMessageRouteMethod =
    (action: ApproveMessageCommandHandler) => (pageUuid: string) => (req: Request, res: Response) => void;

export type EditMessageRouteMethod =
    (action: EditMessageThreadCommandHandler) => (pageUuid: string) => (req: Request, res: Response) => void;

export type PostMessageRouteMethod =
    (action: PostMessageCommandHandler) => (pageUuid: string) => (req: Request, res: Response) => void;

export type CreateNewMessageRouteMethod =
    (action: CreateNewMessageThreadCommandHandler) => (pageUuid: string) => (req: Request, res: Response) => void;

export const postMessageRouteMethod: PostMessageRouteMethod =
    commandHandler => pageUuid => (req: Request, res: Response) => {
        const user = req.user;
        // TODO: Craft message from requeust!
        const message = {title: req.body.title, text: req.body.message} as PostAQuestionCommand;

        const onError = handle([
            reportErrors,
        ]);

        const onSuccess = handle<CommandStatus>([
            logEntry,
            reportCommandSuccess,
            redirectOnSuccess(() => `/question/${pageUuid}`),
        ]);

        const result: FutureResult<CommandStatus> = commandHandler(pageUuid)(message)(user);
        const execute = executeInFuture<CommandStatus>({req, res});
        execute(onError)(onSuccess)(result);
    };

export const postEditedMessageRouteMethod: EditMessageRouteMethod =
    commandHandler => pageUuid => (req: Request, res: Response) => {
        const user = req.user;
        // TODO: Craft message from requeust!
        const message = {title: req.body.title, text: req.body.message} as EditAQuestionCommand;

        const onError = handle([
            logEntry,
            reportErrors,
            redirectTo(`/question/${pageUuid}`),
        ]);

        const onSuccess = handle<CommandStatus>([
            logEntry,
            reportCommandSuccess,
            redirectOnSuccess(() => `/question/${pageUuid}`),
        ]);

        const result: FutureResult<CommandStatus> = commandHandler(pageUuid)(message)(user);
        const execute = executeInFuture<CommandStatus>({req, res});
        execute(onError)(onSuccess)(result);
    };
export const approveMessageRouteMethods: ApproveMessageRouteMethod =
    commandHandler => pageUuid => (req: Request, res: Response) => {
        const user = req.user;
        // TODO: Craft message from requeust!
        const id = user ? user.userId : "";
        const message = {id} as ApproveMessageCommand;

        const onError = handle([
            logEntry,
            reportErrors,
            redirectTo(`/question/${pageUuid}`),
        ]);

        const onSuccess = handle<CommandStatus>([
            logEntry,
            reportCommandSuccess,
            redirectOnSuccess(() => `/question/${pageUuid}`),
        ]);

        const result: FutureResult<CommandStatus> = commandHandler(pageUuid)(message)(user);
        const execute = executeInFuture<CommandStatus>({req, res});
        execute(onError)(onSuccess)(result);
    };

export const createNewMessageThreadRouteMethod: CreateNewMessageRouteMethod =
    commandHandler => pageUuid => (req: Request, res: Response) => {
        const user = req.user;
        const statistics: Statistics = {
            age: req.body.ika,
            area: req.body.seutu,
            relation: req.body.suhde,
        };

        const message = {title: req.body.title, text: req.body.message, statistics} as CreateNewThreadCommand;

        const onError = handle([
            logEntry,
            reportErrors,
            redirectTo(`/question/${pageUuid}`),
        ]);

        const onSuccess = handle<CommandStatus>([
            logEntry,
            reportCommandSuccess,
            redirectOnSuccess(() => `/question/${pageUuid}`),
        ]);

        const result: FutureResult<CommandStatus> = commandHandler(pageUuid)(message)(user);
        const execute = executeInFuture<CommandStatus>({req, res});
        execute(onError)(onSuccess)(result);
    };
