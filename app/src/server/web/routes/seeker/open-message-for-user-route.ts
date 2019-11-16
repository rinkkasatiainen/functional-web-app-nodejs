import {Request, Response} from "express";
import * as xss from "xss";

import {FutureResult} from "../../../domain/actions/action";
import {CanApproveMessage, CanContinueMessageThread, CanCreateNewMessage} from "../../../domain/commands/commands";
import {createActions, createSeekerActions} from "../actions/create-actions";
import {handleFuture} from "../helpers/convert-to-response";
import {onErrorDo, onSuccessFuture} from "../mapper/map-left-error-to-request";
import {
    logentry,
    logout,
    redirectTo,
    renderOnSuccess,
    reportErrors, returnJsonOnSuccess,
} from "../mapper/session_based_mappings";
import {UserMessageThread} from "./types";

type OpenMessageForUserRouteMethod =
    (x: Message.OpenMessageAndLogReadingCommandHandler) => (y: string) => (req: Request, res: Response) => void;

export const openMessageForUserJson: OpenMessageForUserRouteMethod =
    openMessageCommandHandler => pageUuid => (req: Request, res: Response) => {
        const user = req.user;

        // const result: FutureResultA<Message> = openMessageAction(pageUuid)(user);
        const result: FutureResult<Message.Projection> =
            openMessageCommandHandler(pageUuid)(user);
        const handle = handleFuture<Message.Projection>({req, res});

        const onError: (x: { req: Request, res: Response }) => ((y: Failure) => void) =
            onErrorDo([
                logentry,
                logout,
                reportErrors,
                redirectTo("/login"),
            ]);

        const filterBy: (x: Message.Projection) => Message.ForUser = messageThread => {
            const {allowedToOpenUntil, lastMessageSentAt, messages, messageId: streamId, title} = messageThread;
            return {allowedToOpenUntil, lastMessageSentAt, messages, streamId, title};
        };

        const onSuccess: (x: { req: Request, res: Response }) => ((y: Success<Message.Projection>) => void) =
            onSuccessFuture<Message.Projection>([
                logentry,
                returnJsonOnSuccess<Message.Projection, UserMessageThread>(
                    messageThread => {
                        const actions =
                            createActions({streamId: messageThread.messageId})(messageThread.allowedActions);
                        return {
                            actions,
                            thread: filterBy({...messageThread, messageId: messageThread.messageId}),
                            user: {messages: messageThread.messages, uuid: messageThread.messageId},
                        };
                    }),
            ]);

        handle(onError)(onSuccess)(result);
    };

export const openMessageForUserRoute: OpenMessageForUserRouteMethod =
    openMessageCommandHandler => pageUuid => (req: Request, res: Response) => {
        const user = req.user;

        const result: FutureResult<Message.Projection> =
            openMessageCommandHandler(pageUuid)(user);
        const handle = handleFuture<Message.Projection>({req, res});

        const onError: (x: { req: Request, res: Response }) => ((y: Failure) => void) =
            onErrorDo([
                logentry,
                logout,
                reportErrors,
                redirectTo("/login"),
            ]);

        const render: (messageThread: Message.Projection) => string =
            messageThread => {
                if (CanApproveMessage in messageThread.allowedActions) {
                    return "seeker/approveMessageThread";
                }
                if (CanCreateNewMessage in messageThread.allowedActions) {
                    return "seeker/createMessageThread";
                }
                if (CanContinueMessageThread in messageThread.allowedActions) {
                    return "seeker/continueMessageThread";
                }
                return "seeker/messageThread";
            };

        const onSuccess: (x: { req: Request, res: Response }) => ((y: Success<Message.Projection>) => void) =
            onSuccessFuture<Message.Projection>([
                logentry,
                // () => (x: Success<MessageThreadProjection>) => { },
                renderOnSuccess<Message.Projection, Routes.UserMessageThread>(messageThread => {
                    const orig: QuestionResponse[] = messageThread.messages;
                    const messages: XSSSafe.QuestionResponse[] = orig.map((questionResponse: QuestionResponse) => (
                        {
                            question: {
                                date: questionResponse.question.time,
                                xssSafeText: xss.filterXSS(
                                    questionResponse.question.text.replace(/\n/g, "<br/>"),
                                    {whiteList: {br: []}},
                                ),
                            },
                            response: questionResponse.response ?
                                {
                                    date: questionResponse.response.time,
                                    xssSafeText: xss.filterXSS(
                                        questionResponse.response.text.replace(/\n/g, "<br/>"),
                                        {whiteList: {br: []}},
                                    ),
                                } :
                                undefined,
                        }
                    ));
                    const actions = createActions({streamId: messageThread.messageId})(messageThread.allowedActions);
                    const seekerActions =
                        createSeekerActions({streamId: messageThread.messageId})(messageThread.allowedSeekerActions);
                    return {
                        path: `${render(messageThread)}`,
                        value: {
                            actions,
                            allowedToOpenUntil: messageThread.allowedToOpenUntil,
                            lastMessageSentAt: messageThread.lastMessageSentAt,
                            seekerActions,
                            streamId: messageThread.messageId,
                            thread: messages,
                            user: {
                                uuid: messageThread.messageId,
                            },
                            xssSafe: {
                                username: xss.filterXSS(user.username),
                            },
                            xssSafeTitle: xss.filterXSS(messageThread.title),
                        },
                    };
                }),
            ]);

        handle(onError)(onSuccess)(result);
    };
