import {sendGet} from "../login-helper";

const userIsAuthenticated = testSession => async (logger, uuid, token) => {
    const res = await sendGet(testSession, token)("/secret");

    const httpStatusCode = res.statusCode;
    const { body } = res || ""
    const user = body.user || {};
    const {userId} = user

    return {httpStatusCode, userId};
}

export default testSession => ({
    userIsAuthenticated: userIsAuthenticated(testSession),
})
