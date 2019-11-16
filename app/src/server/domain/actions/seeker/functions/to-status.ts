import Future from "fluture";

export function toStatus<T>(text: string): (x: T) => RepositoryAction<CommandStatus> {
    return () => Future.of({status: "created", text});

}
