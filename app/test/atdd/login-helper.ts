import {HTTP} from "./request-helper";

const theAccount = {
    "username": "nacho",
    "password": "iamtheluchadore",
    "password-confirm": "iamtheluchadore",
    "email": "",
};

export const login =  (request, done) => {
    request
        .post("/login")
        .send(theAccount)
        .end((err: Error, res: Response) => {
            if (err) {
                throw err;
            }
            console.log({res})
            // READ: https://jaketrent.com/post/authenticated-supertest-tests/
            // agent.saveCookies(res);
            // done(agent);
        });
};

type RegisterFunc = (x: string) => (y: {username: string, password: string, email: string}) => Promise<any>;
export const register: (x: any) =>  RegisterFunc =  request => uuid =>  async user => {
    return new Promise((resolve, reject) => {
        const {username, password} = user;
        const query = `username=${username}&email=&password=${password}&password-confirm=${password}`;
        request
            .post(`/auth/register/${uuid}`)
            .set("Content-Type", "application/x-www-form-urlencoded")
            .send(user)
            .expect(200)
            .end((err: Error, res: Response) => {
                if (err) {
                    console.error("!!!!!");
                    console.log("ERROR IN TEST:");
                    console.error("!!!!!", err);
                    throw err;
                }
                resolve(res.body);
            });
    });
};
type SendGet = (x: any) => (y: string) => void;
export const sendGet: SendGet =  (testSession, token="") =>  async (url) => {
    return new Promise((resolve, reject) => {
        testSession
            .get(url)
            .set("Authorization", `Bearer ${token}`)
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

function onResponse(err, res) {
    auth.token = res.body.token;
    return done();
}

const logout = (testSession) => async () => {
    return await HTTP.get(testSession)("/auth/logout");
}

export default testSession => ({
    logout: logout(testSession),
    register: register(testSession),
})
