import * as chai from "chai";
import {FutureInstance} from "fluture";

const {expect} = chai;

// tslint:disable-next-line:no-any
export const expectToSucceedWith = (resolve: any) => (future: FutureInstance<any, any>) => (done: any) => {
    future.fork(
        (reject) => {
// tslint:disable-next-line:no-console
            console.error("ERROR in test", {reject});
            throw new Error("should have succesful!");
        },
        (res) => { /*?*/
            expect(res).to.eql(resolve);
            done();
        },
    );
};

// tslint:disable-next-line:no-any
export function expectToSucceed<T>(callback: (x: T) => void): (y: FutureInstance<any, any>) => (z: any) => any {
    return future => done => {
        future.fork(
            (reject) => {
                // tslint:disable-next-line:no-console
                console.log("ERROR in test", {reject});
                throw new Error("should have succeeded!");
            },
            (res) => { /*?*/
                callback(res);
                done();
            },
        );
    };
}

// tslint:disable-next-line
export const expectToFailWith = (resolve: any) => (future: FutureInstance<any, any>) => (done: any) => {
    future.fork(
        (reject) => {
            expect(reject).to.eql(resolve);
            done();
        },
        (res) => { /*?*/
            // tslint:disable-next-line:no-console
            console.log("ERRROR in test, should have failed:", res);
            throw new Error("should have failed!");
        },
    );
};
