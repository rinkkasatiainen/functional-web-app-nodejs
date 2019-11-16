import {expect} from "chai";

import * as randomUUID from "uuid";

import Future from "fluture";
import {FutureStreamId} from "../action";
import {CreateNewMessageThread} from "./create-new-message-thread";

const ERROR = "There's rush on the service, too many questions asked without any answers";
const FAILED_FUTURE = Future.reject( ERROR ) as FutureStreamId;

const whenRoomForThread: Settings.Limit  = {
    whenLimitIsNotReached: () => Future.of({status: "ok"}),
};
const whenLimitReached: Settings.Limit  = {
    whenLimitIsNotReached: () => Future.reject(ERROR),
};

describe("create new message thread", () => {

    it("should be a type of Future", () => {
        const response = CreateNewMessageThread(whenRoomForThread)(() => FAILED_FUTURE)(undefined);
        expect(response).to.be.an.instanceOf(Future);
    });

    describe("when user is logged in", () => {
        const uuidProvider = () => { throw new Error("this should never be called, validation before"); };
        const user = {userId: randomUUID(), username: "anything"};
        it("should not be able to create a new message thread", (done) => {
            CreateNewMessageThread(whenRoomForThread)(uuidProvider)(user)
                .fork(
                    (err) => {
                        expect(err).to.eql({type: "forbidden", reason: "unauthorized"});
                        done();
                    },
                    (res) => {
                        throw new Error("Error should have been thrown");
                    },
                );
        });
    });

    describe("traffic jam - too many messages in the system", () => {
        const uuidProvider = () => {throw Error("should never be called"); };
        it("should return error 429 too many requests", (done) => {
            CreateNewMessageThread(whenLimitReached)(uuidProvider)(undefined)
                .fork(
                    (err) => {
                        expect(err).to.eql({type: "rush", reason: ERROR});
                        done();
                    } ,
                    (res) => {
                        throw new Error("Error should have been thrown");
                    });
        });
    });

    describe("when user can create a new message", () => {
        const uuid = randomUUID();
        const uuidProvider = () => Future.of({uuid}) as FutureStreamId;
        describe("should return newly create StreamId as a Result<StreamId>", () => {
            it("should create new UUID for a new thread", (done) => {
                CreateNewMessageThread(whenRoomForThread)(uuidProvider)(undefined)
                    .fork(
                        () => { throw new Error("Error should not be thrown"); },
                        (result) => { expect(result).to.eql({value: {uuid}}); done(); },
                    );
            });
            it("return the UUID for the thread");

        });
    });
});
