import * as chai from "chai";
import {Request, Response} from "express";
import {spy, stub} from "sinon";
import * as sinonChai from "sinon-chai";
import * as u from "uuid";
import {getSecret} from "./routes";

const {expect} = chai;
chai.use(sinonChai);
const randomUUID = u.v1;
describe("/secret route", () => {
    const username: string = "any-user-user-name";
    let statusSpy: (x: number) => void;
    let jsonSpy: (x: number) => void;
    let req: Request = {user: undefined} as Request;
    let res: Response;
    let uuid: string;

    beforeEach( () => {
        uuid = randomUUID();
        statusSpy = spy();
        jsonSpy = spy();
        req = {
        }  as Request;
        res = {
            json: jsonSpy,
            sendStatus: statusSpy,
        } as Response;
    });

    describe("when authenticated", () => {
        it("should return success", () => {
            req.user = {username, userId: uuid};
            getSecret(req, res);
            expect(statusSpy).to.have.been.calledWith(200);
        });
        it("should return user details", () => {
            req.user = {username, userId: uuid};
            getSecret(req, res);
            expect(jsonSpy).to.have.been.calledWith({
                userId: uuid, username,
                });
        });
    });

    describe("when not authenticated", () => {
        it("should return unauthenticated", () => {
            req.user = undefined;
            getSecret(req, res);
            // expect().to.have.been.calledWith(`/auth/login`);
            expect(statusSpy).to.have.been.calledWith(401);
        });
        it("should return empty body");
    });
    it.skip("should do stuff", () => {
        expect(true).to.eql(true);
    });
    it.skip("should use spy and stub", () => {
        const x = spy();
        const y = stub();
        y.withArgs("1").returns(1);
        expect(y("1")).to.eql(1);
        x();
        expect(x).to.have.been.called;
    });

});
