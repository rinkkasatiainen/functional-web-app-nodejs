export const CanCreateNewMessage = "CanCreateNewMessage";
export const CanContinueMessageThread = "CanContinueMessageThread";
export const CanRemoveCommandForGood = "CanRemoveCommandForGood";
export const CanPostAMessage = "PostAMessage";
export const CanContinueThread = "CanContinueThread";
export const CanLogout = "CanLogout";
export const CanApproveMessage = "CanApproveThread";
export const CanEditMessage = "CanEditMessage";
export const CanMarkAsResponseRead = "CanMarkAsResponseRead";

export const CreateNewMessageThreadCommandDescription = {
    commandPayload: {
        id: "StreamId",
        statistics: {
            age: "string",
        },
        text: "string",
        title: "string",
    },
    type: CanCreateNewMessage,
};

const emptyDescription: (x: string) => SeekerCommands.CommandDescription =
    type => ({commandPayload: {}, type});

export const CanMarkAsResponseReadDescription: SeekerCommands.CommandDescription =
    emptyDescription(CanMarkAsResponseRead);

export const  CanLogoutCommandDescription: SeekerCommands.CommandDescription = {
    commandPayload: {},
    type: CanLogout,
};
export const  CanEditMessageCommandDescription: SeekerCommands.CommandDescription = {
    commandPayload: {},
    type: CanLogout,
};
export const  CanApproveMessageCommandDescription: SeekerCommands.CommandDescription = {
    commandPayload: {},
    type: CanLogout,
};
export const  CanContinueMessageThreadDescription: SeekerCommands.CommandDescription = {
    commandPayload: {},
    type: CanContinueMessageThread,
};
export const  CanContinueThreadDescription: SeekerCommands.CommandDescription = {
    commandPayload: {
        text: "string",
    },
    type: CanContinueMessageThread,
};

export const RemoveMessageThreadForGoodDescription = {
    commandPayload: {
        id: "StreamId",
    },
    type: CanRemoveCommandForGood,
};
