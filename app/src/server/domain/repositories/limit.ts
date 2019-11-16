import Future from "fluture";

export const limit: (x: Settings.PersistentStorage) => (y: QuestionProjection) => Settings.Limit =
    persistentStorage => question => ({
        whenLimitIsNotReached: () => {
            return question.numberOfOpenMessageThreads()
                .chain(
                    numberOfOpenThreads => Future.of({numberOfOpenThreads}),
                )
                .chain(x => persistentStorage.getSetting("settings.rush").chain(y => Future.of({...x, ...y})))
                .mapRej(error => "internal server error")
                .chain(
                    settings => {
                        const {numberOfOpenThreads, limit: kirjekatto, text} = settings;
                        // @ts-ignore
                        if (parseInt(numberOfOpenThreads, 10) >= parseInt(kirjekatto, 10)) {
                            return Future.reject(text);
                        }
                        return Future.of({status: "ok"});
                    },
                );
        },
    });
