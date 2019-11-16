import { expect, use as chaiUse } from "chai";
import {Request, Response} from "express";
import {spy, stub} from "sinon";
import * as sinonChai from "sinon-chai";
chaiUse(sinonChai);
import * as u from "uuid";

const randomUUID = u.v1;

import Future from "fluture";
import {UuidProvider} from "../../../domain/actions/action";
import {createNewMessageThread} from "./index";

describe("/register", () => {
    let uuid: string;
    const uuidProvider: UuidProvider = () => Future.of({uuid});
    const limit: Settings.Limit = { whenLimitIsNotReached: () => Future.of({status: "ok"})};
    let req: Request = { user: undefined} as Request;
    let res: Response = { redirect: (x: string): void => { /* noop */} } as Response;
    let statusSpy: (x: number) => void;
    let logoutSpy: () => void;
    // tslint:disable-next-line:no-any
    let jsonSpy: (x: any) => void;
    beforeEach( () => {
        uuid = randomUUID();
        statusSpy = stub();
        jsonSpy = spy();
        logoutSpy = stub();
        req = {
            logout: logoutSpy,
        }  as Request;
        res = {
            json: jsonSpy,
            status: statusSpy,
        } as Response;
    });

    describe("when there is room for new messages", () => {
        it ("should redirect to new uuid", () => {
            createNewMessageThread({limit, uuidProvider})(req, res);
            // @ts-ignore
            const callArg = res.json.getCall(0).args[0];
            expect(callArg).to.haveOwnProperty("redirectTo", `/auth/register/${uuid}`);
            // expect(redirectTo).to.have.been.calledWith(`/auth/register/${uuid}`);
        });

        it ("should logout, just in case", () => {
            createNewMessageThread({limit, uuidProvider})(req, res);
            // @ts-ignore
            const callArg = res.json.getCall(0).args[0];
            expect(callArg).to.haveOwnProperty("token", undefined);
        });
    });
    describe("when user already authenticated", () => {
        //             onErrorDo([reportErrors, redirectTo("/")]);
        it ("should fail and redirect to root", () => {
            req.user  = {uuid, username: "any string"};
            createNewMessageThread({limit, uuidProvider})(req, res);
            // @ts-ignore
            const callArg = res.json.getCall(0).args[0];
            expect(callArg).to.haveOwnProperty("redirectTo", `/`);
        });
        it ("should set status to 403 forbidden", () => {
            req.user  = {uuid, username: "any string"};
            createNewMessageThread({limit, uuidProvider})(req, res);
            expect(statusSpy).to.have.been.calledWith(403);
        });

    });
});
