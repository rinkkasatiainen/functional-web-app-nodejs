
export as namespace LoginAccount

export interface User {
    userId: StreamId;
    username: string;
}

export interface CanLogin extends User {
    password: string;
}
