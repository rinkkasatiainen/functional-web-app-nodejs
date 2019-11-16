import {Request, Response, Router} from "express";

import {FutureResult, UuidProvider} from "../../../domain/actions/action";
import {CreateNewMessageThread} from "../../../domain/actions/seeker/create-new-message-thread";
import {StreamId} from "../../../domain/actions/streamId";
import {executeInFuture, handle} from "../result/handle-future";
import {logout} from "../result/logout";
import {redirectOnSuccess, redirectTo} from "../result/redirect-to";
import {reportErrors, reportSuccess} from "../result/report-errors";
import {openMessageForUserJson, openMessageForUserRoute} from "./open-message-for-user-route";
import {
    openMessageForUserToEditMessageRoute,
} from "./open-message-for-user-to-continue-route";
import {redirectToUsersOwnMessage} from "./open-message-route";
import {
    approveMessageRouteMethods,
    createNewMessageThreadRouteMethod,
    postEditedMessageRouteMethod, postMessageRouteMethod,
} from "./post-message-route-method";
import {removeMessageRouteMethod} from "./remove-message-route";

export const createNewMessageThread:
    (x: { limit: Settings.Limit, uuidProvider: UuidProvider }) => (req: Request, res: Response) => void =
    ({limit, uuidProvider}) => async (req, res) => {
        const user: LoginAccount.User | undefined = req.user;
        const futureResponse: FutureResult<StreamId> = CreateNewMessageThread(limit)(uuidProvider)(user);

        const handleResponse = executeInFuture<StreamId>({req, res});

        const onError = handle([
                reportErrors,
                logout,
                redirectTo("/"),
            ]);

        const onSuccess =
            handle<StreamId>([
                // debugLogForDev<Success<StreamId>>,
                logout,
                reportSuccess<StreamId>("You can create new Question"),
                redirectOnSuccess<StreamId>(streamId => `/auth/register/${streamId.uuid}`),
            ]);

        handleResponse(onError)(onSuccess)(futureResponse);
    };

export const seekerRoutes: (x: Adapters) => (x: Actions) => (router: Router) => void =
    ({uuidProvider, limit}) => (
        {
            approveMessageCommandHandler,
            createNewMessageCommandHandler,
            editMessageCommandHandler,
            getMessageQueryHandler,
            openMessageCommandHandler,
            postMessageCmdHandler,
            removeThreadForeverCommandHandler,
        }) => router => {
        router.get("/question", (req, res) => {
            redirectToUsersOwnMessage(req, res);
        });

        router.get("/question/:uuid", (req, res) => {
            res.format({
                html: openMessageForUserRoute(openMessageCommandHandler)(req.params.uuid),
                json: openMessageForUserJson(openMessageCommandHandler)(req.params.uuid),
            });
        });

        router.post("/question/:uuid/continue", (req, res) => {
            postMessageRouteMethod(postMessageCmdHandler)(req.params.uuid)(req, res);
        });
        router.get("/question/:uuid/continue", (req, res) => {
            openMessageForUserToEditMessageRoute(getMessageQueryHandler)(req.params.uuid)(req, res);
        });
        router.post("/question/:uuid/continue", (req, res) => {
            postEditedMessageRouteMethod(editMessageCommandHandler)(req.params.uuid)(req, res);
        });
        router.post("/question/:uuid/approve", (req, res) => {
            approveMessageRouteMethods(approveMessageCommandHandler)(req.params.uuid)(req, res);
        });
        router.post("/question/:uuid/remove", (req, res) => {
            removeMessageRouteMethod(removeThreadForeverCommandHandler)(req.params.uuid)(req, res);
        });

        router.post("/question/:uuid", (req, res) => {
            createNewMessageThreadRouteMethod(createNewMessageCommandHandler)(req.params.uuid)(req, res);
        });
    };
