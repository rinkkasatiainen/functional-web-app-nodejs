import {expect} from "chai";
import Future, {FutureInstance} from "fluture";
import * as randomUUID from "uuid";

import {SinonSpy, SinonStub, spy, stub} from "sinon";
import {expectToSucceed} from "../../../../test-helpers/future-test-helpers";
import {firstMessageApproved, firstMessageCreated} from "../../../../test-helpers/test-data";
import {MessageThread} from "../../entities/message-thread";
import {timeToCalendar} from "../../entities/time";
import {Entity} from "../../types/message-thread";
import {openMessageForUser} from "./open-message-for-user";

const fail: (x: StreamId) => RepositoryResult<Entity>
    = () => Future.reject({type: "internal", reason: "should not be executed"});
const failWith: (x: Failure) => (x: StreamId) => RepositoryResult<Entity>
    = failure => () => Future.reject(failure);
const shouldNeverBeCalled: (x: StreamId) => RepositoryResult<Entity>
    = () => {
    throw Error("SHOULD NEVER BE CALLED");
};

describe("opening a page for user", () => {
    const title = "Any title";

    describe("when user is not authenticated", () => {
        it("should return error 401 forbidden", (done) => {
            const queryRepository: Message.Repository = {findMessage: fail} as Message.Repository;
            // const messageProvider: MessageProvider = ({}) => { throw new Error("This should never be called!"); };
            const result = openMessageForUser(queryRepository)(randomUUID())(undefined);
            expectToFailWith({type: "unauthorized", reason: "forbidden"})(result)(done);

        });
    });

    describe("when user is not authorized", () => {
        let userId: string;
        beforeEach(() => {
            userId = randomUUID();
        });
        it("should return error 403 not authorized", (done) => {
            const queryRepository: Message.Repository = {findMessage: shouldNeverBeCalled} as Message.Repository;
            const result = openMessageForUser(queryRepository)(randomUUID())({userId, username: "any string"});

            expectToFailWith({type: "forbidden", reason: "unauthorized"})(result)(done);
        });
        it("should short circuit to authorization error and not execute messageProvider", (done) => {
            const queryRepository: Message.Repository = {findMessage: shouldNeverBeCalled} as Message.Repository;
            const result = openMessageForUser(queryRepository)(randomUUID())({userId, username: "any string"});

            expectToFailWith({type: "forbidden", reason: "unauthorized"})(result)(done);
        });
    });

    describe("when user can see the message", () => {
        let userId: string;
        // tslint:disable-next-line
        const allowedActions: SeekerActions.AllowedMessageActions = {};
        const lastMessageSentAt = "now";

        beforeEach(() => {
            userId = randomUUID();
        });
        it("should return StreamId and messages, as provided by dependency", (done) => {
            // const messageProvider: MessageFromRepository<MessageEntity> =
            //     ({}) => Future.of({
            //         allowedActions,
            //         lastMessageSentAt,
            //         messageId: userId,
            //         messages,
            //         title,
            //         type: "message-thread",
            //     });
            const events: DomainEvents.Stream = [firstMessageCreated, firstMessageApproved];
            // tslint:disable-next-line:no-any
            const messageOf: (x: StreamId) => FutureInstance<any, Message.Entity>
                = (streamId) => Future.of(MessageThread.for(streamId).load(events));
            // @ts-ignore
            const queryRepository: Message.Repository = {
                findMessage: messageOf, save: () => () => () => Future.of({status: "ok"}),
            };
            const result = openMessageForUser(queryRepository)(userId)({userId, username: "any string"});

            const expectedMessageThread: MessageThreadProjection = {
                allowedActions,
                allowedSeekerActions: undefined,
                lastMessageSentAt,
                messageId: userId,
                messages: [{
                    question: {text: firstMessageCreated.payload.text, time: timeToCalendar(firstMessageCreated.time)},
                }],
                title,
                type: "message-thread",
            };

            expectToSucceed((resolve: Success<Message.Projection>) => {
                expect(resolve.value.title).to.eql(firstMessageCreated.payload.title);
                expect(resolve.value.messageId).to.eql(expectedMessageThread.messageId);
                expect(resolve.value.messages).to.eql(expectedMessageThread.messages);
            })(result)(done);
            // expect(result).to.eql(S.Right({userId, messages}));
        });

        it("should call 'messageViewed' on MessageEntity", (done) => {
            const actsOnMessageViewed: SinonSpy = spy();
            let actsOnMessageViewedCallsStub: () => FutureInstance<DomainError, UncommittedMessageEntity>;
            const saveStub: SinonStub = stub();

            // tslint:disable-next-line:no-any
            const fakeMessageWith: (x: StreamId) => FutureInstance<any, Message.Entity> =
                streamId => {
                    const events: DomainEvents.Stream = [firstMessageCreated];
                    const messageThread = MessageThread.for(streamId).load(events);
                    // @ts-ignore
                    actsOnMessageViewedCallsStub = () => {
                        actsOnMessageViewed();
                        return Future.of(messageThread);
                    };
                    messageThread.act.openedMessageThread = actsOnMessageViewedCallsStub;
                    saveStub.returns(Future.of({}));
                    return Future.of(messageThread);
                };

            // @ts-ignore
            const fakedRepository: Message.Repository = {
                findMessage: fakeMessageWith,
                save: () => () => saveStub,
            };

            const result = openMessageForUser(fakedRepository)(userId)({userId, username: "any string"});

            expectToSucceed(() => {
                // console.log( actsOnMessageViewed )
                expect(actsOnMessageViewed).to.have.been.called;
            })(result)(done);
        });

        it("should return error, if messageProvider returns an error", (done) => {
            // const messageProvider: MessageFromRepository<MessageThreadProjection> =
            //     ({}) => Future.reject({type: "forbidden", reason: "forbidden"});
            const queryRepository: Message.Repository = {
                findMessage: failWith({
                    reason: "forbidden",
                    type: "forbidden",
                }),
            } as Message.Repository;
            const future = openMessageForUser(queryRepository)(userId)({userId, username: "any"});

            expectToFailWith({type: "internal", reason: "forbidden"})(future)(done);
        });
    });
});

// tslint:disable-next-line
const expectToFailWith = (reject: any) => (future: FutureInstance<any, any>) => (done: any) => {
    future.fork(
        (err) => {
            expect(err).to.eql(reject);
            done();
        },
        (res) => {
            throw new Error("Error should have been thrown");
        },
    );
};
