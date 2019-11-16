import * as chai from "chai";
import Future from "fluture";
import {now} from "moment";
import * as sinonChai from "sinon-chai";
import * as u from "uuid";

const {expect} = chai;
chai.use(sinonChai);
const randomUUID = u.v1;

import {expectToSucceed} from "../../../test-helpers/future-test-helpers";
import {firstMessageApproved, messageOpened, responded, responseApproved} from "../../../test-helpers/test-data";
import {CanApproveMessage, CanEditMessage, CreateNewMessageThreadCommandDescription} from "../commands/commands";
import {MessageOpenedType, MessageThreadContinuedType, MessageThreadCreatedType} from "../events/events";
import {MessageThread} from "./message-thread";
import {timeToCalendar} from "./time";

describe("Message Thread entity", () => {
    let uuid: StreamId;
    let message: MessageThread;
    const statistics = {age: 1, area: 1, relation: 1};
    const title = "This is title";
    const text = "This is body with a question or a story";
    const time = now();
    const firstMessageCreated: Events.MessageThreadCreated = {
    // @ts-ignore
        payload: {title, text, statistics},
        time,
        type: MessageThreadCreatedType,
    };

    describe("Loading from events", () => {

        describe("one with no events", () => {
            beforeEach(() => {
                uuid = randomUUID();
                message = MessageThread.for(uuid).load([]);
            });

            it("should have version of 0", () => {
                expect(message.version).to.eql(0);
            });
            it("should have streamId", () => {
                expect(message.streamId).to.eql(uuid);
            });
            it("should have empty messages", () => {
                expect(message.messages).to.eql([]);
            });
            it("should have possible actions", () => {
                expect(message.allowedActions).to.eql({PostAMessage: CreateNewMessageThreadCommandDescription});
            });
        });

        describe("When message Thread is created", () => {
            beforeEach(() => {
                uuid = randomUUID();
                message = MessageThread.for(uuid).load([firstMessageCreated]);
            });

            it("should have version of 1", () => {
                expect(message.version).to.eql(1);
            });
            it("should have streamId", () => {
                expect(message.streamId).to.eql(uuid);
            });
            it("should have first message", () => {
                expect(message.messages).to.eql([{question: {time: timeToCalendar(time), text}}]);
            });
            it("should have no allowed actions", () => {
                expect(Object.keys(message.allowedActions)).to.eql([CanApproveMessage, CanEditMessage]);
            });
        });
    });

    describe("domain rules", () => {
        const command = {} as PostAQuestionCommand;
        const commandWithTextAndTitle = {id: uuid, text, title};

        describe("when should be able to postAMessage", () => {
            beforeEach(() => {
                uuid = randomUUID();
                message = MessageThread.for(uuid).load([]);
            });
            it("should have action to PostAMessage", () => {
                expect(message.allowedActions).to.have.key("PostAMessage");
            });

            it("should create new message with couple of uncommitted changes", (done) => {
                const altered = message.act.postAMessage(commandWithTextAndTitle);
                const event: Events.MessageThreadCreated = {
                    payload: {title, text}, time, type: MessageThreadCreatedType,
                };

                expectToSucceed<UncommittedMessageEntity>(
                    (actual) => {
                        expect(actual.originalVersion).to.eql(message.version);
                        expect(actual.version).to.eql(message.version + 1);
                    },
                )(altered)(() => {/**/});

                expectToSucceed<UncommittedMessageEntity>(
                    (actual) => {
                        expect(actual.originalVersion).to.eql(message.version);

                        expect(actual.uncommittedChanges.length).to.eql(1);
                        expect(actual.uncommittedChanges[0].payload).to.eql(event.payload);
                        expect(actual.uncommittedChanges[0].type).to.eql(event.type);

                    },
                )(altered)(done);
            });

            it("should create a whole new instance", () => {
                const altered = message.act.postAMessage(command);
                expect(altered).to.not.equal(message);
            });
            it("should be able to post a new message", (done) => {
                message = MessageThread.for(uuid).load(
                    [firstMessageCreated, firstMessageApproved, responded, responseApproved],
                );
                const altered = message.act.postAMessage(commandWithTextAndTitle);
                const event: Events.MessageThreadContinued = {
                    payload: {text}, time, type: MessageThreadContinuedType,
                };

                expectToSucceed<UncommittedMessageEntity>(
                    (actual) => {
                        expect(actual.originalVersion).to.eql(message.version);
                        expect(actual.version).to.eql(message.version + 1);
                        expect(actual.uncommittedChanges.length).to.eql(1);
                        expect(actual.uncommittedChanges[0].payload).to.eql(event.payload);
                        expect(actual.uncommittedChanges[0].type).to.eql(event.type);
                    },
                )(altered)(done);
            });

        });
        describe("should not be able to postAMessage", () => {

            describe("when first message is not answered to", () => {
                beforeEach(() => {
                    uuid = randomUUID();
                    message = MessageThread.for(uuid).load([firstMessageCreated]);
                });
                it("should not have the action", () => {
                    expect(message.allowedActions).to.not.have.key("PostAMessage");
                });
                it("should fail with DomainError", () => {
                    expect(message.act.postAMessage(command)).to.eql(
                        Future.reject({
                            reason: `Message with ${uuid} cannot perform action 'PostAMessage'`,
                            type: "Domain Error",
                        }),
                    );
                });
            });
        });
        describe("opening message thread", () => {
            it("should add event, if message is answered to", (done) => {
                message = MessageThread.for(uuid).load(
                    [firstMessageCreated, firstMessageApproved, responded],
                );
                const altered = message.act.openedMessageThread();

                expectToSucceed<UncommittedMessageEntity>(
                    (actual) => {
                        expect(actual.originalVersion).to.eql(message.version);
                        expect(actual.version).to.eql(message.version);
                        expect(actual.uncommittedChanges.length).to.eql(0);
                    },
                )(altered)(done);
            });
            it("should not add multiple events, if message is answered to", (done) => {
                message = MessageThread.for(uuid).load(
                    [firstMessageCreated, firstMessageApproved, responded, messageOpened],
                );
                const altered = message.act.openedMessageThread();

                expectToSucceed<UncommittedMessageEntity>(
                    (actual) => {
                        expect(actual.version).to.eql(message.version);
                        expect(actual.uncommittedChanges.length).to.eql(0);
                    },
                )(altered)(done);

            });
            it("should not add event, if message is not anwered to", (done) => {
                message = MessageThread.for(uuid).load(
                    [firstMessageCreated, firstMessageApproved, responded, responseApproved],
                );
                const altered = message.act.openedMessageThread();
                const event: Events.MessageOpened = {
                    payload: {}, time, type: MessageOpenedType,
                };

                expectToSucceed<UncommittedMessageEntity>(
                    (actual) => {
                        expect(actual.version).to.eql(message.version + 1 );
                        expect(actual.uncommittedChanges[0].payload).to.eql(event.payload);
                        expect(actual.uncommittedChanges[0].type).to.eql(event.type);
                    },
                )(altered)(done);

            });
        });
    });

});
