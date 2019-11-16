import { expect } from "chai";
import * as S from "sanctuary";

import {eitherToFuture} from "./either-to-future";

describe("eitherToFuture", () => {
    const anyResult = {str: "any"};

    it("on Left", (done) => {
        const res = eitherToFuture(S.Left(anyResult));

        res.fork(
            (err) => {
                expect(err).to.eql(anyResult);
                done();
            },
            () => {
                throw new Error("Error should have been thrown");
            },
        );
    });

    it("on Right", (done) => {
        const res = eitherToFuture(S.Right(anyResult));

        res.fork(
            () => {
                throw new Error("Error should have been thrown");
            },
            (resolve) => {
                expect(resolve).to.eql(anyResult);
                done();
            },
        );

    });

});
