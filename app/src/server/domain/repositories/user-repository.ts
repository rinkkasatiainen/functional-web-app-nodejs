export const Users: (x: UserDb) =>  Users =
    userDb => ({
        addStatistics: streamId => statistics => userDb.addStatistics(streamId)(statistics),
        getUser: (streamId) => userDb.findById(streamId),
        getUsername: (streamId) =>  userDb.findById(streamId).map( user => user.username ),
    });
