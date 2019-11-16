
export const  removeAccount: (x: UserDb) => (y: QuestionProjection) => RemoveAccount =
    userDb => questionProjection => ({
        removeAccount: (streamId) => {
            return questionProjection.ensureNoQuestionFor(streamId).and(
                userDb.removeAccount(streamId),
            );
        },
    });
