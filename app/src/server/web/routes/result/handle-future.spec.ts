import {Request, Response} from "express";

import * as chai from "chai";
import {spy, stub} from "sinon";
import * as sinonChai from "sinon-chai";

const {expect} = chai;
chai.use(sinonChai);

import {ErrorResult, ErrorStatus, handle, handleErrors, sendErrorDetails} from "./handle-future";

describe ("handleFuture", () => {
    const status: ErrorStatus = "internal";
    const reportErrors =  (x: Failure) => ({...x, status});

    let req: Request;
    let res: Response;
    // tslint:disable-next-line:no-any
    let statusSpy: (x: any ) => void
    // tslint:disable-next-line:no-any
    let jsonSpy: (x: any) => void;

    describe("on failure", () => {
        beforeEach(() => {
            jsonSpy = spy();
            statusSpy = spy();
            req = {} as Request;
            res = {
                json: jsonSpy,
                status: statusSpy,
            } as Response;
        });
        it("should return the changes to the functions ", () => {
            const reason: Failure = {type: "internal", reason: "bar"};

            const result = handleErrors([reportErrors, reportErrors])(reason);

            expect(result).to.eql({...reason, status});
        });
    });
    describe("calls the functions", () => {

        it("hsould do magic", () => {
            const reason: Failure = {type: "internal", reason: "bar"};

            handle([reportErrors])({req, res})(reason);

            expect(jsonSpy).to.have.been.called;
        });
    });
}) ;

describe("reportErrorsFunc", () => {
    const req: Request = {} as Request;
    // tslint:disable-next-line:no-any
    let funcSpy: (x: any) => void;
    let res: Response;

    beforeEach(() => {
        funcSpy = spy();
        res = {
            status: funcSpy,
        } as Response;
    });

    it("should do nothing when no value on status", () => {
       const errorResult: ErrorResult = {};
       sendErrorDetails(errorResult)({req, res});
       expect(funcSpy).to.not.have.been.called;
    });

    it("should set status code as the one in Failure", () => {
        const errorResult: ErrorResult = {error: {type: "internal", reason: "any reason"}};
        sendErrorDetails(errorResult)({req, res});

        expect(funcSpy).to.have.been.calledWith(500);
    });
});

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
