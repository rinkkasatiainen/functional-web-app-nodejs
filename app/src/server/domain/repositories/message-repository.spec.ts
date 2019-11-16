import * as chai from "chai";
import Future, {FutureInstance} from "fluture";
import {SinonSpy, SinonStub, spy, stub} from "sinon";
import * as sinonChai from "sinon-chai";
import * as u from "uuid";

const {expect} = chai;
chai.use(sinonChai);

import {firstMessageCreated} from "../../../test-helpers/test-data";
import {MessageThread} from "../entities/message-thread";
import {messageRepository} from "./message-repository";

const randomUUID = u.v1;
const title = firstMessageCreated.payload.title;
const text = "this is actual body text";

// tslint:disable-next-line:no-any
type saveFunc = (id: string, version: number, event: Events.DomainEvent<Events.Types, any>) => RepositoryAction<any>;
const numberOfOpenMessageThreads = () => Future.of(10) as FutureInstance<RepositoryError, number>;
const ensureNoQuestionFor = () => { throw Error("Is not called"); };

describe("Message Repository", () => {
    let loadById: SinonStub;
    let save: saveFunc;
    let saveSpy: SinonSpy;

    describe("Load messager", () => {
        let uuid: StreamId;

        beforeEach(() => {
            uuid = randomUUID();
            loadById = stub();
            saveSpy = spy();
        });

        it("should load Entity from event stream", () => {
            loadById.withArgs(uuid).returns(Future.of([firstMessageCreated]));
            const addQuestion = () => Future.of({status: "ok"}) as  FutureInstance<RepositoryError, CommandStatus>;

            const repository = messageRepository({loadById, save: saveSpy} )(
                {addQuestion, numberOfOpenMessageThreads, ensureNoQuestionFor},
                );

            const loadByStreamId = repository.loadByStreamId;

            const result: RepositoryResult<MessageEntity> = loadByStreamId(uuid);

            result.fork(
                (reject) => {
                   throw new Error("Rejected");
                },
                (resolve) => {
                    const messageThread = MessageThread.for(uuid).load([firstMessageCreated]);
                    expect(
                        {...resolve, act: null, lastMessageSentAt: null, allowedSpeakerActions: null}).to.eql(
                            {...messageThread, act: null, lastMessageSentAt: null, allowedSpeakerActions: null});
                    expect(resolve.streamId).to.eql(uuid);
                    expect(resolve.title).to.eql(title);
                });
        });
    });

    describe("save messages", () => {
        let uuid: StreamId;
        let spyFunc: SinonSpy;

        beforeEach(() => {
            uuid = randomUUID();
            spyFunc = spy();
        });

        it("should save entity", (done) => {

            // const messageCreatedEvent: Events.MessageThreadCreated = {
            //     payload: { title, text },
            //     time: now(),
            //     type: MessageThreadCreatedType,
            // };
            const message = MessageThread.for(uuid).load([]);
            const modifiedMessage = message.act.postAMessage({id: uuid, title, text});
            save = (id, version, event) => { spyFunc(id, version, event); return Future.of(1); };
            const addQuestion = () => Future.of({status: "ok"}) as  FutureInstance<RepositoryError, CommandStatus>;
            const repository = messageRepository({loadById, save} )(
                {addQuestion, numberOfOpenMessageThreads, ensureNoQuestionFor},
                );

            modifiedMessage.fork(
                // tslint:disable-next-line:no-any
                (reject: any) => { throw new Error("Should have been ok!"); },
                // tslint:disable-next-line:no-any
                (resolve: any) => {
                    repository.save(uuid)(resolve.version)(resolve);
                    expect(spyFunc).to.have.been.calledWith(uuid, 2 );
                    done();
                },
            );

        });

    });

});
