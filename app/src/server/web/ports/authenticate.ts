import {Application} from "express";
import {Pool} from "pg";

import {model} from "../../infrastructure/db/UserAccount";

export const authenticate: (x: Pool) => (app: Application) => Server.Authenticate =
    pool => app => {
        // @ts-ignore
        // require("./session/authenticate");
        // @ts-ignore
        // require("./session/passport");
        const UserAccount: Auth.UserAccount = model(pool);
        require("./session/passport").passportConfig(pool);
        const auth: Server.Authenticate = require("./session/authenticate").authenticateSession(UserAccount);
        // passport(app);
        return auth;
    };
