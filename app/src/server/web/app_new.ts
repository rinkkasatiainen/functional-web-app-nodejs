import {Application, Router} from "express";
import {Server} from "http";
import {AddressInfo} from "net";
import {Pool} from "pg";

import {authenticate} from "./ports/authenticate";
import {routes} from "./routes/routes";
import {xPress} from "./x-press";

// import {flash} from 'connect-flash';

export declare type AuthProvider = (a: Application) => Server.Authenticate;
export declare type RoutesProvider = (a: Application) => (b: Server.Authenticate) => Router;
export declare interface EnvVariables {
    PORT: string;
    AUTH_POLICY: string;
    APPLICATION: string;
    PG_DATABASE: string;
    PG_PORT: number;
    PG_USER: string;
    PG_PASSWORD: string;
    PG_HOST: string;
}

const router: Router = Router();
const authFor: (x: Pool) => AuthProvider = authenticate;

export const startServer: (x: EnvVariables) => (y: Pool) => Server =
    envVars => pool => {

        const routesProvider: RoutesProvider = routes(router)(pool);
        const authProvider = authFor(pool);
        const application: Application =
            xPress(authProvider)(routesProvider)(pool);

        // tslint:disable-next-line
        console.log("starting app");

        // TODO AkS: Fix flashes!
        const port = envVars.PORT || 7778;
        application.set("port", port);
        const server = application.listen(port, () => {
            // tslint:disable-next-line
            console.log(`Express running → PORT ${(server.address() as AddressInfo).port}`);
        });
        return server;
    };
