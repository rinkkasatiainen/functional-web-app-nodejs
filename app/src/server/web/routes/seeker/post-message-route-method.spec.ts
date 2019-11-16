import {expect, use as chaiUse} from "chai";
import {Request, Response} from "express";
import * as sinon from "sinon";
import * as sinonChai from "sinon-chai";
import * as u from "uuid";

const randomUUID = u.v1;

import Future from "fluture";

import {stub} from "sinon";
import {postMessageRouteMethod} from "./post-message-route-method";

chaiUse(sinonChai);

describe("creating new question", () => {

    const body = {
        message: "The contents",
            title: "Message title",
    };

    describe("when sending succeedes", () => {
        let userId: string;
        let req: Request = {user: undefined} as Request;
        let res: Response = {
            redirect: (x: string): void => { /* noop */
            },
        } as Response;
        let statusSpy: (x: number) => void;
        let jsonSpy: (x: string) => void;

        let logoutSpy: () => void;
        beforeEach(() => {
            userId = randomUUID();
            jsonSpy = sinon.spy();
            logoutSpy = stub();
            statusSpy = sinon.spy();
            req = {
                body,
                logout: logoutSpy,
            }  as Request;
            res = {
                json: jsonSpy,
                status: statusSpy,
            } as Response;
        });

        it("should redirect to the message when sending a message succeeds!", () => {
            const postNewMessageAction: PostMessageCommandHandler = () => () => () => Future.of({value: {status: "ok"}});

            postMessageRouteMethod(postNewMessageAction)(userId)(req, res);

            // @ts-ignore
            const callArg = res.json.getCall(0).args[0];
            expect(callArg).to.haveOwnProperty("redirectTo", `/question/${userId}`);
        });

        it("should flash success message", () => {
            const text = "this is flashed";
            const status = "created";
            const postNewMessageAction: PostMessageCommandHandler = () => () => () =>
                Future.of({value: {status, text}, reason: `${status}`} );

            postMessageRouteMethod(postNewMessageAction)(userId)(req, res);

            expect(statusSpy).to.have.been.calledWith(201);
        });

    });
    describe("when creating a message fails", () => {
        let userId: string;
        let req: Request = {user: undefined} as Request;
        let res: Response;
        let redirectTo: (x: string) => void = stub();
        let jsonSpy: (x: string) => void;
        let logoutSpy: (x: string) => void;
        let flashSpy: (x: string, y: string) => void;
        let statusSpy: () => void;
        beforeEach(() => {
            userId = randomUUID();
            logoutSpy = stub();
            flashSpy = stub();
            jsonSpy = stub();
            redirectTo = sinon.spy();
            statusSpy = stub();
            req = {
                body,
                flash: flashSpy,
                logout: logoutSpy,
            }  as Request;
            res = {
                json: jsonSpy,
                redirect: redirectTo,
                status: statusSpy,
            } as unknown as Response;
        });

        it("should not be able to send a new question if newest is not answered to", () => {
            const reason: Failure = {type: "forbidden", reason: userId};
            const postNewMessageAction: PostMessageCommandHandler = () => () => () => Future.reject(reason);

            postMessageRouteMethod(postNewMessageAction)(userId)(req, res);

            expect(statusSpy).to.have.been.calledWith(403);
            expect(jsonSpy).to.have.been.calledWith({error: reason});
        });
    });
});
