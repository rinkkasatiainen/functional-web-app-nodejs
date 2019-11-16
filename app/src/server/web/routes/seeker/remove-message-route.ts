import {Request, Response} from "express";
import {FutureResult} from "../../../domain/actions/action";
import {handleFuture} from "../helpers/convert-to-response";
import {handleErrors, handleSuccess} from "../mapper/map-left-error-to-request";
import {
    logentry, logout,
    redirectOnSuccess,
    redirectTo,
    reportCommandSuccess,
    reportErrors,
} from "../mapper/session_based_mappings";

type RemoveRouteMethod =
    (x: Message.RemoveThreadForeverCommandHandler) => (y: StreamId) => (req: Request, res: Response) => void;

export const removeMessageRouteMethod: RemoveRouteMethod =
    performAction => pageUuid => (req: Request, res: Response) =>  {
        const user = req.user;

        const onError = handleErrors([
            logout,
            logentry,
            reportErrors,
            redirectTo(`/question/${pageUuid}`),
        ]);

        const onSuccess = handleSuccess<CommandStatus>([
            logout,
            logentry,
            reportCommandSuccess,
            redirectOnSuccess(() => "/logout"),
        ]);

        const result: FutureResult<CommandStatus> = performAction(pageUuid)(user);
        const handle = handleFuture<CommandStatus>({req, res});
        handle(onError)(onSuccess)(result);
    };
