export const convertToErrorType: (x: {type: DomainErrorsTypes}) => (y: string) => Failure =
    hashToAdd => reason =>  ({
        ...hashToAdd,
        reason,
    });
