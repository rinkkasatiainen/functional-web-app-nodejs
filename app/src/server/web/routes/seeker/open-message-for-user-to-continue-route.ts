import {Request, Response} from "express";
import * as xss from "xss";

import {FutureResult} from "../../../domain/actions/action";
import {createActions, createSeekerActions} from "../actions/create-actions";
import {handleFuture} from "../helpers/convert-to-response";
import {onErrorDo, onSuccessFuture} from "../mapper/map-left-error-to-request";
import {
    logentry,
    logout,
    redirectTo,
    renderOnSuccess,
    reportErrors,
} from "../mapper/session_based_mappings";

type OpenMessageForUserRouteMethod<T> =
    (x: T) => (y: string) => (req: Request, res: Response) => void;

export const openMessageForUserToContinueRoute: OpenMessageForUserRouteMethod<Message.GetMessageQueryHandler> =
    messageRepository => pageUuid => (req: Request, res: Response) => {
        const user = req.user;

        const result: FutureResult<Message.Projection> =
            messageRepository(pageUuid)(user);
        const handle = handleFuture<Message.Projection>({req, res});

        const onError: (x: { req: Request, res: Response }) => ((y: Failure) => void) =
            onErrorDo([
                logentry,
                logout,
                reportErrors,
                redirectTo("/login"),
            ]);

        const onSuccess: (x: { req: Request, res: Response }) => ((y: Success<Message.Projection>) => void) =
            onSuccessFuture<Message.Projection>([
                logentry,
                // () => (x: Success<Message.Projection>) => { },
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
                        path: `seeker/continueMessageThread`,
                        value: {
                            actions,
                            seekerActions,
                            streamId: messageThread.messageId,
                            thread: messages,
                            user: {
                                messages,
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

export const openMessageForUserToEditMessageRoute: OpenMessageForUserRouteMethod<Message.GetMessageQueryHandler> =
    getMessageProjectionQueryHandler => pageUuid => (req: Request, res: Response) => {
        const user = req.user;

        const result: FutureResult<Message.Projection> =
            getMessageProjectionQueryHandler(pageUuid)(user);
        const handle = handleFuture<Message.Projection>({req, res});

        const onError: (x: { req: Request, res: Response }) => ((y: Failure) => void) =
            onErrorDo([
                logentry,
                logout,
                reportErrors,
                redirectTo("/login"),
            ]);

        const onSuccess: (x: { req: Request, res: Response }) => ((y: Success<Message.Projection>) => void) =
            onSuccessFuture<Message.Projection>([
                logentry,
                // () => (x: Success<Message.Projection>) => { },
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
                    const editableMessage = messageThread.messages.slice(-1)[0].question;
                    const seekerActions =
                        createSeekerActions({streamId: messageThread.messageId})(messageThread.allowedSeekerActions);
                    return {
                        path: `seeker/editMessage`,
                        value: {
                            actions,
                            editableMessage,
                            seekerActions,
                            streamId: messageThread.messageId,
                            thread: messages,
                            user: {
                                messages,
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
