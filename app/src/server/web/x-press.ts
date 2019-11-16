import * as express from "express";
import {Application} from "express";

import {Pool} from "pg";
import {model} from "../infrastructure/db/UserAccount";
import {AuthProvider, RoutesProvider} from "./app_new";
import * as errorHandlers from "./helpers/errorHandlers";
import {authMW} from "./ports/auth-mw";

export const xPress: (a: AuthProvider) => (r: RoutesProvider) => (p: Pool) => Application
    = authProvider => routesProvider => pool => {

    const expressApp: Application = express();
// HTTP helpers
    const bodyParser = require("body-parser");
    expressApp.use(bodyParser.json());
    expressApp.use(bodyParser.urlencoded({extended: true}));
// validators
    const expressValidator = require("express-validator");
    expressApp.use(expressValidator());

// ports
    const auth = authProvider(expressApp);
    const router = routesProvider(expressApp)(auth);

    expressApp.use(authMW(model(pool)));

    expressApp.use("/", router);
// error handlers
    expressApp.use(errorHandlers.notFound);
        /* Development ErrorD Handler - Prints stack trace */
    if (expressApp.get("env") === "development" || expressApp.get("env") === "test") {
        expressApp.use(errorHandlers.developmentErrors);
    }

    expressApp.use(errorHandlers.productionErrors);

    return expressApp;
};
