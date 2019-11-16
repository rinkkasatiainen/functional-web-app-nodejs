import * as chai from "chai";
import Future from "fluture";
import * as sinonChai from "sinon-chai";
import * as u from "uuid";

chai.use(sinonChai);

import {expectToSucceedWith} from "../../../test-helpers/future-test-helpers";
import {Users} from "./user-repository";

const randomUUID = u.v1;

describe("User Repository", () => {
    describe("get username", () => {
        it("should return username", (done) => {
            const id = randomUUID();
            const username = id;
            const userDb: UserDb = {
                addStatistics: () => () => Future.reject({type: "500", reason: "SHOULD NOT HAPPEN"}),
                findById: () => Future.of({username: id, id}),
                removeAccount: () => { throw Error("Is not called in tests"); },
            };
            const userUsername = Users(userDb).getUsername(id);

            expectToSucceedWith(username)(userUsername)(done);
        });

        describe("find user", () => {
        /**/
        });

        describe("save user", () => {
/**/
        });

    });
});
