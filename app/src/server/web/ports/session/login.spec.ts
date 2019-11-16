import * as chai from "chai";
import {NextFunction, Request, Response} from "express";
import Future, {FutureInstance} from "fluture";
import {spy, stub} from "sinon";
import * as sinonChai from "sinon-chai";
import {login, LOGIN_FAILED_REQUIRES_AUTHENTICATION} from "./login";

const {expect} = chai;
chai.use(sinonChai);

import * as u from "uuid";

const randomUUID = u.v1;

describe("it", () => {
    it.skip("should do stuff", () => {
        expect(true).to.eql(true);
    });
    it("should use spy and stub", () => {
        const x = spy();
        const y = stub();
        y.withArgs("1").returns(1);
        expect(y("1")).to.eql(1);
        x();
        expect(x).to.have.been.called;
    });

});

const url = "/any/url";
let req: Request;
let res: Response;
let next: NextFunction;
let redirectTo: (x: string) => void = stub();
let jsonSpy: (x: string) => void = spy();
let flashSpy: (x: string, y: string) => void;
let logoutSpy: () => void;

const executebefore = () => {
    jsonSpy = spy();
    next = spy();
    flashSpy = spy();
    redirectTo = stub();
    logoutSpy = stub();
    req = {
        flash: flashSpy,
        logout: logoutSpy,
        url,
    }  as Request;
    res = {
        json: jsonSpy,
        redirect: redirectTo,
    } as Response;
};

describe("login", () => {

    describe("Failure", () => {

        const loginFunc = () => { throw new Error("should not be called on failures"); };
        beforeEach(() => {
            executebefore();
        });

        it.skip("should call next(err) if error in auth function", () => {
            const error = "any error";
            const passportFunc: Auth.AuthFunc = () => Future.reject({type: "login-error", reason: "any"});
            login(passportFunc)(loginFunc)(req, res, next);

            expect(next).to.have.been.calledWith(error);
        });

        it("should redirect if user is not found while passportFunc succeeded", () => {
            const passportFunc = () => Future.of(undefined) as FutureInstance<Auth.LoginError, undefined>;

            login(passportFunc)(loginFunc)(req, res, next);

            expect(res.json).to.have.been.calledWith({error: LOGIN_FAILED_REQUIRES_AUTHENTICATION, status: "error"} );
        });
    });

    describe("on success", () => {
        let loginFunc: Auth.LoginFunc;
        const adultInDuty: LoginAccount.User = {
            userId: randomUUID(),
            username: "any user",
        };
        beforeEach(() => {
            executebefore();
            loginFunc = () => () => Future.of(adultInDuty);
        });
        it("should call loginFunc", () => {
            const passportFunc = () => Future.of(adultInDuty) as FutureInstance<Auth.LoginError, LoginAccount.User>;

            login(passportFunc)(loginFunc)(req, res, next);

            // @ts-ignore
            const callArg = res.json.getCall(0).args[0];
            expect(callArg).to.haveOwnProperty("status", "ok");
            expect(callArg).to.haveOwnProperty("token");
            expect(Object.keys(callArg).sort()).to.eql(["status", "token"]);
        });
    });
});
