// Make sure we are running node 7.6+
import {Pool} from "pg";

const [major, minor] = process.versions.node.split(".").map(parseFloat);
if (major < 7 || (major === 7 && minor <= 5)) {
    // tslint:disable-next-line
    console.log("🛑 🌮 🐶 💪 💩\nHey You! \n\t ya you! \n\t\tBuster! \n\tYou're on an older version of node that doesn't support the latest and greatest things we are learning (Async + Await)! Please go to nodejs.org and download version 7.6 or greater. 👌\n ");
    process.exit();
}

// import environmental variables from our variables.env file
import {config} from "dotenv";

const path = (process.env.NODE_ENV === "test" ? "test.env" : "variables.env");
config({path});

import {postgresPool} from "../../src/server/infrastructure/postgres/pool";
import {EnvVariables, startServer} from "../../src/server/web/app_new";

const {PORT, AUTH_POLICY, APPLICATION, PG_DATABASE, PG_USER, PG_HOST, PG_PORT, PG_PASSWORD} = process.env;
const envVars = {
    APPLICATION,
    AUTH_POLICY,
    PG_DATABASE,
    PG_HOST,
    PG_PASSWORD,
    PG_PORT: parseInt(PG_PORT || "5432", 10),
    PG_USER,
    PORT,
} as EnvVariables;

const pgConfig = {
    database: envVars.PG_DATABASE,
    host: envVars.PG_HOST,
    // password: 'docker',
    password: envVars.PG_PASSWORD,
    port: envVars.PG_PORT,
    user: envVars.PG_USER,
};

let pool: Pool | null;

const getPoolForTesting = () => {
    if (!pool) {
        pool = postgresPool(pgConfig);
    }
    return pool;
};

export const testServer = {
    getPoolForTesting ,
    start: () => startServer(envVars)(getPoolForTesting()),
};
