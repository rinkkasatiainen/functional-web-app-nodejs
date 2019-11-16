import fetch from "node-fetch";

import {HTTP} from "./request-helper";

const newMessageThread = async (serverUrl: string, logger) => {
    logger("Get UUID that is used to register");
    const url1 = `${serverUrl}/auth/register`;
    const {status, url, body} = await fetch(url1, {method: "GET"})
        .then(res => {
            if ( !(res.status === 200 || res.status === 201) ) {
                throw new Error("Failed to create register");
            }
            return res.json();
        }).then( body => ({body}));

    console.log({status, url, body});
    // const uuid = url.match(/\/auth\/register\/([0-9a-z-]{36})$/)[1];

    const uuid = body.value.uuid;
    logger(`UUID is ${uuid}`);
    return {status, uuid};
};

const createMessage = (testSession, token) => uuid => async message => {
    const url = `/question/${uuid}`;
    const {status: statusCode, body} = await HTTP.post(testSession, token)(url)({...message});
    console.log({statusCode, body});
    return {statusCode, body};
};
const getUserMessages = (testSession, token) => async uuid => {
    const {body} = await HTTP.get(testSession, token)(`/question/${uuid}`);
    return {body}
};

export default testSession => ({
    new: newMessageThread,
    on: (token) => ({
        getAll: getUserMessages(testSession, token),
        send: createMessage(testSession, token),
    }),
});
