import * as chai from "chai";
import {Request, Response} from "express";
import {SinonSpy, spy, stub} from "sinon";
import * as sinonChai from "sinon-chai";
import * as u from "uuid";

const {expect} = chai;
chai.use(sinonChai);
const randomUUID = u.v1;

import Future from "fluture";
import {
    CanCreateNewMessage, CanLogout,
    CanLogoutCommandDescription, CanRemoveCommandForGood,
    CreateNewMessageThreadCommandDescription, RemoveMessageThreadForGoodDescription,
} from "../../../domain/commands/commands";
import {DomainFailure} from "../../../domain/types/errors";
import {openMessageForUserJson, openMessageForUserRoute} from "./open-message-for-user-route";

let commandHandler: Message.OpenMessageAndLogReadingCommandHandler;

describe("route for /question/:uuid", () => {
    const username: string = "any-user-user-name";
    const title: string = "Any title anyone could have";
    let req: Request = {user: undefined} as Request;
    let res: Response = {
        redirect: (x: string): void => { /* noop */
        },
    } as Response;
    let uuid: string;
    let redirectTo: (x: string) => void = stub();
    let render: (x: string) => void = spy();
    let json: (x: string) => void = spy();
    let flashSpy: (x: string, y: string) => void;
    let logoutSpy: () => void;
    const messages: QuestionResponse[] = [
        {question: {time: "today", text: "blob"}, response: {time: "now", text: "blob"}},
    ];
    const executebefore = () => {
        render = spy();
        json = spy();
        uuid = randomUUID();
        flashSpy = stub();
        redirectTo = stub();
        logoutSpy = stub();
        req = {
            flash: flashSpy,
            logout: logoutSpy,
        }  as Request;
        res = {
            json,
            redirect: redirectTo,
            render,
        } as Response;
    };

    describe("Returning json", () => {
        beforeEach(executebefore);
        const time = "any time";
        const text = "the question";
        const getSuccess: () => Message.Projection = () => ({
            allowedActions: {[CanCreateNewMessage]: CreateNewMessageThreadCommandDescription},
            allowedSeekerActions: {
                [CanLogout]: CanLogoutCommandDescription,
                [CanRemoveCommandForGood]: RemoveMessageThreadForGoodDescription,
            },
            allowedToOpenUntil: "forever",
            lastMessageSentAt: "now",
            messageId: uuid,
            messages: [{question: {text, time}}],
            title,
        });
        it("should return fields for a message thread", () => {
            req.user = {username, userId: uuid};
            const returnsNoSentQuestions: Message.OpenMessageAndLogReadingCommandHandler =
                streamId => () => Future.of({value: getSuccess()});
            openMessageForUserJson(returnsNoSentQuestions)(uuid)(req, res);
            const expected = {
                allowedToOpenUntil: "forever",
                lastMessageSentAt: "now",
                messages: [{question: {text, time}}],
                streamId: uuid,
                title,
            };
            const jsonResponse = ( json as SinonSpy).getCall(0).lastArg;
            expect(expected).to.eql(jsonResponse.thread);
        });

        xit("should return available actions", () => {
            req.user = {username, userId: uuid};
            const returnsNoSentQuestions: Message.OpenMessageAndLogReadingCommandHandler =
                streamId => () => Future.of({value: getSuccess()});
            openMessageForUserJson(returnsNoSentQuestions)(uuid)(req, res);
            const expected = {
                allowedToOpenUntil: "forever",
                lastMessageSentAt: "now",
                messages: [{question: {text, time}}],
                streamId: uuid,
                user: {uuid},
            };
            const callArgs = ( json as SinonSpy).getCall(0).lastArg;
            expect(expected).to.eql(callArgs.actions);
            expect(render).to.have.been.calledWith("seeker/createMessageThread");

        });

    });

    // OpenMessageForUser :: string => UserAccountDetails => MessageProvider => Result<Message>;
    describe("when can open message", () => {
        describe("when user has sent a question", () => {
            beforeEach(executebefore);

            it("once approved, should redirect to message with uuid route returned by SUCCESS", () => {
                const success = {
                    allowedActions: {},
                    allowedToOpenUntil: "forever",
                    lastMessageSentAt: "now",
                    messageId: uuid,
                    messages,
                    title,
                    username,
                };
                const [question] = messages;
                const responseMessages: XSSSafe.QuestionResponse = {
                    question: {xssSafeText: question.question.text, date: question.question.time},
                    // @ts-ignore
                    response: {date: question.response.time, xssSafeText: question.response.text},
                };
                req.user = {username, userId: uuid};
                const returnsApprovedMessage: Message.OpenMessageAndLogReadingCommandHandler =
                    () => () => Future.of({value: success});
                openMessageForUserRoute(returnsApprovedMessage)(uuid)(req, res);
                const expected = {
                    actions: {},
                    allowedToOpenUntil: "forever",
                    lastMessageSentAt: "now",
                    seekerActions: {},
                    streamId: uuid,
                    thread: [responseMessages],
                    user: {uuid},
                    xssSafe: {username: "any-user-user-name"},
                    xssSafeTitle: "Any title anyone could have",
                };
                const callArgs = ( render as SinonSpy).getCall(0).lastArg;
                expect(expected).to.eql(callArgs);
                expect(render).to.have.been.calledWith("seeker/messageThread");
            });
        });

        describe("when user has not sent question", () => {
            beforeEach(executebefore);

            it("should render view to create a new message thread!", () => {
                const success: Message.Projection = {
                    allowedActions: {[CanCreateNewMessage]: CreateNewMessageThreadCommandDescription},
                    allowedSeekerActions: {
                        [CanLogout]: CanLogoutCommandDescription,
                        [CanRemoveCommandForGood]: RemoveMessageThreadForGoodDescription,
                    },
                    allowedToOpenUntil: "forever",
                    lastMessageSentAt: "now",
                    messageId: uuid,
                    messages: [],
                    title,
                };
                req.user = {username, userId: uuid};
                const returnsNoSentQuestions: Message.OpenMessageAndLogReadingCommandHandler =
                    streamId => () => Future.of({value: success});
                openMessageForUserRoute(returnsNoSentQuestions)(uuid)(req, res);
                const expected = {
                    actions: {},
                    allowedToOpenUntil: "forever",
                    lastMessageSentAt: "now",
                    seekerActions: {
                        CanLogout: {method: "GET", name: "Logout", path: "/auth/logout"},
                        CanRemoveCommandForGood: {
                            alert: "Are you sure, you cannot change your decision!",
                            method: "POST",
                            name: "Remove question for good!",
                            path: `/question/${uuid}/remove`,
                        },
                    },
                    streamId: uuid,
                    thread: [],
                    user: {uuid},
                    xssSafe: {username: "any-user-user-name"},
                    xssSafeTitle: "Any title anyone could have",
                };
                const callArgs = ( render as SinonSpy).getCall(0).lastArg;
                expect(expected).to.eql(callArgs);
                expect(render).to.have.been.calledWith("seeker/createMessageThread");

            });
        });
    });

    describe("when user fails to open message", () => {
        let validationErrors: DomainFailure<"internal">;

        beforeEach(() => {
            executebefore();
            validationErrors = {type: "internal", reason: uuid};
            commandHandler = () => () => Future.reject(validationErrors);
        });

        it("should flash the type, if Action returns a failure", () => {
            req.user = undefined;
            openMessageForUserRoute(commandHandler)(uuid)(req, res);
            expect(flashSpy).to.have.been.calledWith("internal");
        });
        it("should flash the unauthorized, if user is not authenticated", () => {
            req.user = undefined;
            openMessageForUserRoute(commandHandler)(uuid)(req, res);
            expect(flashSpy).to.have.been.calledWith("internal", uuid);
        });
        it("should redirect to login", () => {
            req.user = undefined;
            openMessageForUserRoute(commandHandler)(uuid)(req, res);
            expect(redirectTo).to.have.been.calledWith(`/login`);
        });
        it("should logout", () => {
            req.user = undefined;
            openMessageForUserRoute(commandHandler)(uuid)(req, res);
            expect(logoutSpy).to.have.been.called;
        });
        describe("when authentication is missing", () => {
            it("should have WWW-authenticate header");
        });
        describe("validation errors", () => {
            it.skip("should flash all errors", () => {
                // tslint:disable-next-line
                const action = () => Future.reject(validationErrors) as any;
                req.user = undefined;
                openMessageForUserRoute(action)(uuid)(req, res);
                expect(flashSpy).to.have.been.calledTwice;
                expect(flashSpy).to.have.been.calledWith("401");
            });

        });
    });
});
