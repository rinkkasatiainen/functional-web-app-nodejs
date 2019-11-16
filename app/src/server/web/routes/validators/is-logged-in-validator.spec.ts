import { expect, use as chaiUse } from "chai";
import * as S from "sanctuary";
import * as sinonChai from "sinon-chai";
import * as u from "uuid";

import {isAuthenticated, isAuthorized} from "./is-logged-in";

const randomUUID = u.v1;

chaiUse(sinonChai);

describe("authentication function", () => {
    describe("when not in request", () => {
        it("should not be logged in", () => {
            const result = isAuthenticated(undefined);
            expect(result).to.eql(S.Left(
                {type: "unauthorized", reason: "you need to login to open the page"},
            ));
        });
    });
});

describe("authorization", () => {
    describe("should not be authorized", () => {
        let uuid: string;
        beforeEach( () => {
            uuid = randomUUID();
        });

        it("when user is not present", () => {
            const result = isAuthorized(uuid.toString())();
            expect(result).to.eql(S.Left(
                {type: "forbidden", reason: "user.not.allowed.to.open.stream"},
            ));
        });
    });
});
