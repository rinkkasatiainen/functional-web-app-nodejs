
export as namespace SeekerCommands

// tslint:disable-next-line:no-empty-interface
interface Base {
}

interface CommandDescription {
    // tslint:disable-next-line:no-any
    commandPayload: any;
    type: string;
}

export type CanLogout = Base;
