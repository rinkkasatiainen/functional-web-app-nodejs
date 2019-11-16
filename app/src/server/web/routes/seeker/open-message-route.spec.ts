import * as chai from "chai";
import {Request, Response} from "express";
import {spy, stub} from "sinon";
import * as sinonChai from "sinon-chai";
import * as u from "uuid";

const {expect} = chai;
chai.use(sinonChai);
const randomUUID = u.v1;

import {redirectToUsersOwnMessage} from "./open-message-route";

describe("Open message Route", () => {
    const username: string = "any-user-user-name";
    let req: Request = { user: undefined} as Request;
    let res: Response = { redirect: (x: string): void => { /* noop */ } } as Response;
    let uuid: string;
    let statusSpy: (x: number) => void;
    // tslint:disable-next-line:no-any
    let jsonSpy: (x: any) => void;
    beforeEach( () => {
        uuid = randomUUID();
        statusSpy = stub();
        jsonSpy = spy();
        req = {
        }  as Request;
        res = {
            json: jsonSpy,
            status: statusSpy,
        } as Response;
    });

    describe("when can open message", () => {
        it("should redirect to message with uuid route", () => {
            req.user = {username, userId: uuid};
            redirectToUsersOwnMessage(req, res);
            // @ts-ignore
            const callArg = res.json.getCall(0).args[0];
            expect(callArg).to.haveOwnProperty("redirectTo", `/question/${uuid}`);
        });
    });

    describe("when loading a route fails", () => {
        it("should redirect to login", () => {
            req.user = undefined;
            redirectToUsersOwnMessage(req, res);
            // @ts-ignore
            const callArg = res.json.getCall(0).args[0];
            expect(callArg).to.haveOwnProperty("redirectTo", `/auth/login`);
        });

        it("should flash unauthorized", () => {
            req.user = undefined;
            redirectToUsersOwnMessage(req, res);
            expect(statusSpy).to.have.been.calledWith(401);
        });
    });
});
