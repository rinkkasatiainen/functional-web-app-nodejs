import {expect, use as chaiUse} from "chai";
import {SinonStub, stub} from "sinon";
import * as sinonChai from "sinon-chai";
import * as u from "uuid";

const randomUUID = u.v1;

import Future from "fluture";
import {expectToSucceed, expectToSucceedWith} from "../../../test-helpers/future-test-helpers";
import {firstMessageCreated} from "../../../test-helpers/test-data";
import {
    CanApproveMessage, CanApproveMessageCommandDescription,
    CanCreateNewMessage, CanEditMessage, CanEditMessageCommandDescription,
    CanPostAMessage,
    CreateNewMessageThreadCommandDescription,
} from "../commands/commands";
import {MessageThread} from "../entities/message-thread";
import {timeToCalendar} from "../entities/time";
import {findMessageQueryHandler} from "./find-message-query-handler";

chaiUse(sinonChai);
describe("find-message-query-handler", () => {

    const loadByStreamId = stub() as SinonStub;
    const getUser = stub() as SinonStub;
    const getUsername = stub() as SinonStub;
    const addStatistics = stub() as SinonStub;
    const Messages = {loadByStreamId};
    const Users = {getUser, getUsername, addStatistics};
    const username = "Any user";
    const actionsOnNoMessagesSent: SeekerActions.AllowedMessageActions = {
        [CanPostAMessage]: CreateNewMessageThreadCommandDescription,
        [CanCreateNewMessage]: CreateNewMessageThreadCommandDescription,
    };
    // const actionsOnOneMessageSent: SeekerActions.AllowedMessageActions = {};
    const actionsAfterWrigintFirstMessage: SeekerActions.AllowedMessageActions = {
        [CanApproveMessage]: CanApproveMessageCommandDescription,
        [CanEditMessage]: CanEditMessageCommandDescription,
    };

    let uuid: string;
    let user: LoginAccount.User;

    beforeEach(() => {
        uuid = randomUUID();
        user = {username, userId: uuid};
    });
    it("should create Message Entity from empty events of stream", (done) => {
        getUser.withArgs(uuid).returns(Future.of(user));
        loadByStreamId.withArgs(uuid).returns(Future.of(MessageThread.for(uuid).load([])));
        const result = findMessageQueryHandler(Users)(Messages)(uuid);
        const expectedMessage = {
            allowedActions: actionsOnNoMessagesSent,
            lastMessageSentAt: "",
            messageId: uuid,
            messages: [],
            title: "",
            type: "messages-from-repository",
        };
        expectToSucceedWith(expectedMessage)(result)(done);
    });

    it("should have 'CanCreateMessageThread' action", (done) => {
        getUser.withArgs(uuid).returns(Future.of(user));
        loadByStreamId.withArgs(uuid).returns(Future.of(MessageThread.for(uuid).load([])));
        const result = findMessageQueryHandler(Users)(Messages)(uuid);
        const expectedAction: SeekerActions.AllowedMessageActions = {
            [CanPostAMessage]: CreateNewMessageThreadCommandDescription,
            [CanCreateNewMessage]: CreateNewMessageThreadCommandDescription,
        };
        expectToSucceed(
            (res: MessageThreadProjection) => { expect(expectedAction).to.eql(res.allowedActions); })(result)(done);
    });

    describe("on a stream of events", () => {

        it("should be able to approve message", (done) => {
            const title = firstMessageCreated.payload.title;
            const text = firstMessageCreated.payload.text;
            const time = timeToCalendar(firstMessageCreated.time);
            const allowedActions = actionsAfterWrigintFirstMessage;

            const messageEntity = MessageThread.for(uuid).load([firstMessageCreated]);
            getUser.withArgs(uuid).returns(Future.of(user));
            loadByStreamId.withArgs(uuid).returns(Future.of(messageEntity));

            const result = findMessageQueryHandler(Users)(Messages)(uuid); /*.map(
                res => {
                    console.log(res)
                    const {messageId: a, messages: b, title, username} = result;
                    return  {messageId: a, messages: b, title, username};
                }
            );*/
            const expectedMessage: MessageThreadProjection = {
                allowedActions,
                lastMessageSentAt: time,
                messageId: uuid,
                messages: [{question: {time, text}}],
                title,
                type: "messages-from-repository",
            };

            expectToSucceedWith(expectedMessage)(result)(done);
        });
    });
});
