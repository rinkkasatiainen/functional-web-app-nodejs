export as namespace Routes

export interface UserMessageThread {
    xssSafe: {
        username: string,
    };
    user: {
        uuid: StreamId,
    };
}
