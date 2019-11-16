import Future from "fluture";
import {Pool} from "pg";
import {executeQuery} from "../postgres/execute-query";

interface Data {
    data: Settings.Value;
}

export const postgresSettingsStore: (x: Pool) => Settings.PersistentStorage =
    pool => ({
        getSetting: (type) => executeQuery<Data>
        (pool)
        ("SELECT type, data FROM settings WHERE type = $1 order by SequenceNum desc")
        ([type])
            .map(e => e.rows)
            .map(rows => rows[0])
            .chain(setting => {
                if (!setting) {
                    return Future.reject({status: 500, reason: "Setting not found"});
                }
                return Future.of(setting.data);
            }),
    });
