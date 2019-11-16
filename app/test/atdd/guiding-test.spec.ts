import * as chai from "chai";
import * as chaiSubset from "chai-subset";
import * as request from "supertest";
import * as session from "supertest-session";

import {now, timeToCalendar} from "../../src/server/domain/entities/time";
import loginHelper from "./login-helper";
import messageHelper from "./message-helper";
import {testServer} from "./server";
import {logTestStep} from "./test_helpers";

import authHelper from "./login/user-is-authenticated";

const {expect} = chai;
chai.use(chaiSubset);

const HTTP_STATUS_SUCCESS = 200;
const HTTP_STATUS_REDIRECT = 302;
const HTTP_STATUS_UNAUTHENTICATED = 401;

const JWT_TOKEN_REGEXP = /^[a-zA-Z0-9._-]+$/;

describe("guiding test", () => {
    let app;
    const username = "A-user-name";
    const password = "a-long-enough-password";
    const serverUrl = "http://127.0.0.1:8082";
    const REGISTRATION_PAYLOAD = {username, password, "password-confirm": password};
    let testSession;
    let logger;
    let login;
    let auth;
    let message;

    before(async () => {
        app = testServer.start();
    });

    beforeEach(async () => {
        const pool = testServer.getPoolForTesting();

        const klient = await pool.connect();

        await klient.query("DELETE FROM question");
        await klient.query("DELETE FROM account WHERE username = $1", [username]);
        await klient.release();

        testSession = request(app);
        login = loginHelper(testSession);
        auth = authHelper(testSession);
        message = messageHelper(testSession);
    });

    afterEach(async () => {
    });

    after(async () => {
        app.close(() => {
            console.log("Http server closed.");
        });
        return testServer.getPoolForTesting().end();
    });

    describe("when registering to write a new message", () => {
        it("should get a new UUID", (done) => {
            request(app)
                .get("/auth/register")

                .expect((res => {
                    expect(res.body.value.uuid).to.match(/[0-9a-z-]{36}$/)
                }))
                .expect("Content-Type", /json/)
                .expect(200, done);
        });

        it("should be able to be done", async () => {
            logger = logTestStep("should be able to be done");

            const {uuid} = await message.new(serverUrl, logger);
            const body = {username, password, "password-confirm": password};

            const jsonBody = await login.register(uuid)(body);
            expect(jsonBody.status).to.eql("ok");
            expect(jsonBody.token).to.match(JWT_TOKEN_REGEXP);
        });

        it("should be authenticated when done", async () => {
            logger = logTestStep("should be authenticated when done");
            const {uuid} = await message.new(serverUrl, logger);

            const {token} = await login.register(uuid)(REGISTRATION_PAYLOAD);
            const {httpStatusCode} = await auth.userIsAuthenticated(logger, uuid, token);

            expect(httpStatusCode).to.eql(HTTP_STATUS_SUCCESS);
        });
    });

    describe("when authenticated", () => {
        const title = "Title";
        const text = "teksti";
        const msg = {title, message: text};
        describe("should be able to retrieve messages", () => {

            it("should have 0 messages, after registering", async () => {
                logger = logTestStep("should have 0 messages, after registering");

                const {uuid} = await message.new(serverUrl, logger);

                const {token} = await login.register(uuid)(REGISTRATION_PAYLOAD);
                const {body} = await message.on(token).getAll(uuid);
                const {thread: messages} = body;

                expect(messages).to.containSubset({
                    messages: [],
                    streamId: uuid,
                });
            });

            it("should be able to create a message and retrieve it", async () => {
                logger = logTestStep("should be able to create a message and retrieve it");
                const {uuid} = await message.new(serverUrl, logger);

                const {token} = await login.register(uuid)(REGISTRATION_PAYLOAD);

                await message.on(token).send(uuid)(msg);

                const time = timeToCalendar(now());
                const {body: {thread}} = await message.on(token).getAll(uuid);

                expect(thread).to.containSubset({
                    messages: [
                        {question: {time, text}},
                    ],
                    streamId: uuid,
                    title,
                });
            }).timeout(5000);
        });
    });
    it("can logout", async () => {
        logger = logTestStep("can logout");
        const {uuid} = await message.new(serverUrl, logger);
        await login.register(uuid)(REGISTRATION_PAYLOAD);
        await login.logout();

        const {httpStatusCode} = await auth.userIsAuthenticated(logger, uuid);
        expect(httpStatusCode).to.eql(HTTP_STATUS_UNAUTHENTICATED);

        // const {body} = await message.getAll(uuid);
        // expect(body).to.eql({foo: "bar"})
    }).timeout(5000);

    describe("when user", () => {
        const title = "Title";
        const text = "teksti";
        const msg = {title, message: text};
        describe("sends a message", () => {
            it("fails if message is missing data", async () => {
                logger = logTestStep("fails if message is missing data");
                const {uuid} = await message.new(serverUrl, logger);
                await login.register(uuid)(REGISTRATION_PAYLOAD);

                const {body: {actions}, statusCode} = await message.send(uuid)({...msg, title: ""});

                expect(statusCode).to.eql(400);
                expect(actions).to.eql({foo: "bar"});

            });
            it("it requires approval for the sent message", async () => {
                logger = logTestStep("requires approval for the sent message");
                const {uuid} = await message.new(serverUrl, logger);
                await login.register(uuid)(REGISTRATION_PAYLOAD);

                const {body: {actions}} = await message.send(uuid)(msg);

                expect(actions).to.eql({foo: "bar"});
            });
        });
    });
});
