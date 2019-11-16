// export interface Respo{
//     body: any;
//     statusCode: number;
// }

const GET: (testSession: any, token: any) => (uri: string) => Promise<Response> =
    (testSession, token) => async (url) => {
        return new Promise((resolve, reject) => {
            testSession
                .get(url)
                .set("Authorization", `Bearer ${token}`)
                .set("Accept", "application/json")
                .send()
                .end((err, res) => {
                    if (err) {
                        console.error("!!!!!");
                        console.log("ERROR IN TEST:");
                        console.error("!!!!!");
                        reject({err});
                    }
                    resolve(res);
                });
        });
    };
function POST<T>(testSession: any, token: any): (uri: string) => (payload: T) => Promise<Response>  {
    return  url => async (payload) => {
        return new Promise((resolve, reject) => {
            testSession
                .post(url)
                .set("Authorization", `Bearer ${token}`)
                .set("Accept", "application/json")
                .send(payload)
                .end((err, res) => {
                    if (err) {
                        console.error("!!!!!");
                        console.log("ERROR IN TEST:");
                        console.error("!!!!!");
                        reject({err});
                    }
                    resolve(res);
                });
        });
    };
}

export const HTTP = ({
    get: GET,
    post: POST,
});
