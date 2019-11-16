import {Pool} from "pg";

export const postgresPool: (x: Db.PoolConfig) => Pool =
    config => {
        const pool = new Pool(config);

// the pool with eOmit an error on behalf of any idle clients
// it contains if a backend error or network partition happens
        pool.on("error", (err, client) => {
            // tslint:disable-next-line:no-console
            console.error("Unexpected error on idle client", err);
            process.exit(-1);
        });

// callback - checkout a client
        pool.connect((err, client, done) => {
            if (err) {
                throw err;
            }
            client.query("SELECT COUNT (*) FROM events", (err1, res) => {
                done();

                if (err1) {
                    // tslint:disable-next-line:no-console
                    console.log("ERRORRRRRR", err1.stack);
                } else {
                    // tslint:disable-next-line:no-console
                    console.log(res.rows[0]);
                }
            });
        });

// promise - checkout a client
        pool.connect()
            .then(client => {
                return client.query("SELECT COUNT (*) FROM events")
                    .then(res => {
                        client.release();
                        // tslint:disable-next-line:no-console
                        console.log(res.rows[0]);
                    })
                    .catch(e => {
                        client.release();
                        // tslint:disable-next-line:no-console
                        console.log("FOOOOO", e.stack);
                    });
            });

        return pool;
    };
