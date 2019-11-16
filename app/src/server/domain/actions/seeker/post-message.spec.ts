import * as chai from "chai";
import Future, {FutureInstance} from "fluture";
import {SinonStub, spy, stub} from "sinon";
import * as sinonChai from "sinon-chai";
import * as randomUUID from "uuid";

import * as moment from "moment";
import {expectToSucceedWith} from "../../../../test-helpers/future-test-helpers";
import {MessageThread} from "../../entities/message-thread";
import {now, timeToCalendar} from "../../entities/time";
import {createNewThread} from "./post-message";

const {expect} = chai;
chai.use(sinonChai);

// const fail: (x: StreamId) => RepositoryResult<Entity>
//     = () => Future.reject({type: "internal", reason: "should not be executed"});
// const failWith: (x: Failure) => (x: StreamId) => RepositoryResult<Entity>
//     = failure => () => Future.reject(failure);
function shouldNeverBeCalled<T, U>(method: string): (x: T) => U {
    return () => { throw Error(`'${method}' SHOULD NEVER BE CALLED`); };
}

// tslint:disable-next-line:no-any
function silentlyAcceptStatistics<T>(): () => FutureInstance<any, CommandStatus> {
    return () => Future.of({status: "ok"});
}
describe("Posting a message", () => {
    const statistics = {age: 1, area: 1, relation: 1} as Statistics;
    let loadById: (x: string) => RepositoryResult<MessageEntity>;
    let save;
    let addQuestion;
    let repository: MessageRepository;
    let users: Users;

    describe("when user is not authenticated", () => {

        beforeEach(() => {
            loadById = spy();
            save = spy();
            addQuestion = spy();
            repository = {loadByStreamId: loadById, save, addQuestion} as MessageRepository;
            users = {
                addStatistics: silentlyAcceptStatistics,
                getUser: shouldNeverBeCalled("getUSer"),
                getUsername: shouldNeverBeCalled("getUsername"),
            };
        });

        const message = {} as CreateNewThreadCommand;

        it("should return error 401 forbidden", (done) => {
            Future.reject({type: "500", reason: "should not be executed"});
            const user = undefined;

            const result = createNewThread(repository)(users)(randomUUID())(message)(user);

            expectToFailWith({type: "unauthorized", reason: "forbidden"})(result)(done);
        });
    });

    describe("when user is not authorized", () => {
        let userId: string;
        const message = {} as CreateNewThreadCommand;
        beforeEach(() => {
            loadById = spy();
            save = spy();
            addQuestion = spy();
            repository = {loadByStreamId: loadById, save, addQuestion} as MessageRepository;
            userId = randomUUID();
        });
        it("should return error forbidden not authorized", (done) => {
            const user = {userId, username: "any"};
            const result = createNewThread(repository)(users)(randomUUID())(message)(user);
            expectToFailWith({type: "forbidden", reason: "unauthorized"})(result)(done);
        });
        it("should short circuit to authorization error and not execute messageProvider", (done) => {
            const user = {userId, username: "any"};
            const result = createNewThread(repository)(users)(randomUUID())(message)(user);
            expectToFailWith({type: "forbidden", reason: "unauthorized"})(result)(done);
            expect(repository.loadByStreamId).to.not.have.been.called;
            expect(repository.save).to.not.have.been.called;
        });

    });

    describe("when user can send a message", () => {
        let userId: StreamId;
        let postaMessageCommand: CreateNewThreadCommand;
        let user: LoginAccount.User;
        let loadByStreamId: SinonStub;
        const text = "This is a long text, with a quiestion";
        const title = "this is a title";
        const args: Array<{ streamId: StreamId, version: number, message: MessageEntity }> = [];

        let postANewMessage: SinonStub;

        // @ts-ignore
        // tslint:disable-next-line:one-variable-per-declaration
        let approveAMessage, editMessage, postAMessage, createNewMessageThread, openedMessageThread: SinonStub;
        let messageEntity: MessageEntity;
        let modifiedMessage: UncommittedMessageEntity;

        beforeEach(() => {
            userId = randomUUID();
            postaMessageCommand = { id: userId, text, title, statistics };
            user = {userId, username: "Any username"};

            postANewMessage = stub();
            approveAMessage = editMessage = postAMessage = createNewMessageThread = openedMessageThread = stub();
            // tslint:disable-next-line:no-any
            const fakeActWith: (x: any) => MessageBehavior = (act) => ({
            // @ts-ignore
                approveAMessage, createNewMessageThread, editMessage, openedMessageThread, postAMessage, ...act,
            });
            loadByStreamId = stub();
            // @ts-ignore
            save = streamId => version => message => {
                args.push({streamId, version, message});
                return Future.of({status: "ok"}) as RepositoryAction<CommandStatus>;
            };
            // @ts-ignore
            addQuestion = () => Future.of({status: "created"});
            messageEntity = {
                act: fakeActWith({createNewMessageThread: postANewMessage}),
                allowedActions: {},
                // @ts-ignore
                allowedToOpenUntil: new moment(now()),
                lastMessageSentAt: () => "now",
                messages: [],
                streamId: userId,
                version: 0,
            };
            modifiedMessage = {...messageEntity, originalVersion: messageEntity.version, uncommittedChanges: []};
            postANewMessage.returns(Future.of(modifiedMessage));

            users = {
                addStatistics: silentlyAcceptStatistics,
                getUser: shouldNeverBeCalled("getUSer"),
                getUsername: shouldNeverBeCalled("getUsername"),
            };

            // @ts-ignore
            repository = {loadByStreamId, save, addQuestion} as MessageRepository;
        });
        it("should save message", (done) => {

            loadByStreamId.withArgs(userId).returns(Future.of(messageEntity));
            const result = createNewThread(repository)(users)(userId)(postaMessageCommand)(user);

            result.fork(
                (reject) => {
                    throw new Error("should have been thrown");
                },
                (resolve) => {
                    const expectedMessage = {
                        message: modifiedMessage,
                        streamId: userId,
                        version: 0,
                    };
                    expect(args).to.eql([expectedMessage]);
                    done();
                },
            );

        });

        it("should resolve to a CommandStatus", (done) => {

            loadByStreamId.withArgs(userId).returns(Future.of(messageEntity));
            const result = createNewThread(repository)(users)(userId)(postaMessageCommand)(user);

            result.fork(
                (reject) => {
                    throw new Error("should have been thrown");
                },
                (resolve) => {
                    expect(resolve.value).to.eql(
                        {status: "created", text: "Question requires your approval."},
                    );
                    done();
                },
            );

        });

        it("should call message entity to publish a message", (done) => {

            const messageWithMethodSpy = {
                ...messageEntity,
                createNewMessageThread: postANewMessage,
            };
            loadByStreamId.withArgs(userId).returns(Future.of(messageWithMethodSpy));
            const result = createNewThread(repository)(users)(userId)(postaMessageCommand)(user);

            result.fork(
                (reject) => {
                    throw new Error("should have been thrown");
                },
                (resolve) => {
                    expect(postANewMessage).to.have.been.calledWith(postaMessageCommand);
                    done();
                },
            );

        });
    });

    describe("on MessageEntity", () => {
        let userId: StreamId;
        const title = "Any title";
        const text = "Any text";
        describe("which is brand new", () => {
            let spyArgs: Array<{ streamId: StreamId, version: number, message: UncommittedMessageEntity }> = [];
            const messageEntity = MessageThread.for(userId).load([]);
            let messageRepository: MessageRepository;

            beforeEach(() => {
                userId = randomUUID();
                spyArgs = [];
                messageRepository = {
                    addQuestion: streamId => Future.of({status: "created"}),
                    loadByStreamId: () => Future.of(messageEntity),
                    save: streamId => version => message => {
                        // @ts-ignore
                        spyArgs.push({streamId, version, message});
                        return Future.of({status: "created"});
                    },
                };
                users = {
                    addStatistics: silentlyAcceptStatistics,
                    getUser: shouldNeverBeCalled("getUSer"),
                    getUsername: shouldNeverBeCalled("getUsername"),
                };
            });

            it("should save to repository", (done) => {
                const command: CreateNewThreadCommand = {id: userId, title, text, statistics};
                const user = {userId, username: "any username"};
                const future = createNewThread(messageRepository)(users)(userId)(command)(user);
                future.fork(
                    (reject) => {
                        throw new Error("Should've been succesfull");
                    },
                    (resolve) => {
                        const {message: {messages, title: msgTitle, version}} = spyArgs[0];
                        expect(spyArgs.length).to.eql(1);
                        expect(messages).not.to.eql(messageEntity.messages);
                        expect(messages).to.eql([{question: {time: timeToCalendar(now()), text}}]);
                        expect(msgTitle).not.to.eql(messageEntity.title);
                        expect(version).to.eql(messageEntity.version + 1);

                        done();
                    },
                );
            });

            it("should return good Domain Response", (done) => {
                const command: CreateNewThreadCommand = {id: userId, title, text, statistics};
                const user = {userId, username: "any username"};
                const future = createNewThread(messageRepository)(users)(userId)(command)(user);
                expectToSucceedWith({
                    value: {
                        status: "created",
                        text: "Question requires your approval.",
                    },
                })(future)(done);
            });
        });
        describe("When things don't really work", () => {
            beforeEach(() => {
                userId = randomUUID();
            });
            it("should fail if domain logic is failing - on entity");

            it("should fail if repository cannot load", (done) => {
                const command: CreateNewThreadCommand = {id: userId, title, text, statistics};
                const user = {userId, username: "any username"};
                const messageRepository: MessageRepository = {
                    addQuestion: streamId => {
                        throw new Error("should not have been called!");
                    },
                    loadByStreamId: () => Future.reject({type: "RepositoryError", reason: "random failure"}),
                    save: streamId => version => message => {
                        throw new Error("should not have been called!");
                    },
                };

                const future = createNewThread(messageRepository)(users)(userId)(command)(user);
                expectToFailWith({reason: "random failure", type: "RepositoryError"})(future)(done);
            });
            it("should fail if domain logic fails!", (done) => {
                const command: CreateNewThreadCommand = {id: userId, title, text, statistics};
                const user = {userId, username: "any username"};
                const messageThread = MessageThread.for(userId).load([]);
                // @ts-ignore
                messageThread.act.createNewMessageThread = () => Future.reject({reason: "domain error"});
                const messageRepository: MessageRepository = {
                    addQuestion: streamId => {
                        throw new Error("should not have been called!");
                    },
                    loadByStreamId: () => Future.of(messageThread),
                    save: streamId => version => message => {
                        throw new Error("should not have been called!");
                    },
                };

                const future = createNewThread(messageRepository)(users)(userId)(command)(user);
                expectToFailWith({reason: "domain error"})(future)(done);
            });
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
